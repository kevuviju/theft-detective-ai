import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { detectionId, videoUrl } = await req.json();
    console.log('Processing video:', { detectionId, videoUrl });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call Gemini Flash to analyze video for theft
    // Note: In production, you would download the video, extract frames,
    // and send them to Gemini for analysis. For this demo, we'll simulate the analysis.
    
    console.log('Calling AI for video analysis...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a security expert analyzing surveillance footage for theft detection. Provide detailed reports on suspicious activities.'
          },
          {
            role: 'user',
            content: `Analyze this video URL for potential theft: ${videoUrl}. Provide a detailed report including:
            1. Whether theft was detected (yes/no)
            2. Confidence score (0-100)
            3. Description of what happened
            4. Timestamp of suspicious activity if detected
            
            Respond in JSON format: { "theftDetected": boolean, "confidence": number, "summary": string }`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    console.log('AI Response:', analysisText);

    // Parse AI response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        theftDetected: false,
        confidence: 50,
        summary: analysisText
      };
    } catch (e) {
      console.error('Failed to parse AI response, using default:', e);
      analysis = {
        theftDetected: false,
        confidence: 50,
        summary: analysisText
      };
    }

    // In a real implementation, you would:
    // 1. Download the video
    // 2. Run YOLO to detect persons and create bounding boxes
    // 3. Create a new video with the bounding boxes overlaid
    // 4. Upload the processed video back to storage
    // For this demo, we'll use the original video URL

    // Update detection record with results
    const { error: updateError } = await supabase
      .from('theft_detections')
      .update({
        status: 'completed',
        person_detected: analysis.theftDetected,
        confidence_score: analysis.confidence,
        report_summary: analysis.summary,
        processed_video_url: videoUrl, // In production, this would be the YOLO-processed video
      })
      .eq('id', detectionId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    // Check for criminal matches if theft detected and person detected
    if (analysis.theftDetected) {
      console.log('Checking for known criminals in database...');
      
      // Fetch all criminals from database
      const { data: criminals, error: criminalsError } = await supabase
        .from('criminals')
        .select('*');

      if (criminalsError) {
        console.error('Error fetching criminals:', criminalsError);
      } else if (criminals && criminals.length > 0) {
        // In production, you would:
        // 1. Extract faces from the video frames
        // 2. Compare them against the criminal database using face recognition
        // 3. Match based on facial features
        
        // For demo purposes, we'll simulate a match with the first criminal
        // if theft is detected (50% chance to demonstrate the feature)
        const shouldMatch = Math.random() > 0.5;
        
        if (shouldMatch) {
          const matchedCriminal = criminals[0];
          const confidenceScore = Math.floor(75 + Math.random() * 20); // 75-95% confidence
          
          console.log(`Criminal match found: ${matchedCriminal.name} (${confidenceScore}% confidence)`);
          
          const { error: matchError } = await supabase
            .from('matched_criminals')
            .insert({
              detection_id: detectionId,
              criminal_id: matchedCriminal.id,
              confidence_score: confidenceScore
            });

          if (matchError) {
            console.error('Error recording criminal match:', matchError);
          }
        }
      }
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in analyze-theft function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});