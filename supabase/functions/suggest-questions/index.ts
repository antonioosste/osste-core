import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { conversationHistory = [] } = await req.json();

    // Build context from conversation history
    let contextPrompt = "Generate 3-5 thoughtful, open-ended questions that would help someone capture their life story and memories.";
    
    if (conversationHistory.length > 0) {
      contextPrompt = `Based on the following conversation history, generate 3-5 thoughtful follow-up questions that naturally build on what has been shared:\n\n`;
      conversationHistory.forEach((turn: any, idx: number) => {
        if (turn.prompt) contextPrompt += `Q${idx + 1}: ${turn.prompt}\n`;
        if (turn.answer) contextPrompt += `A${idx + 1}: ${turn.answer}\n`;
      });
      contextPrompt += `\nGenerate questions that dig deeper into themes mentioned, explore related memories, or help capture important life moments.`;
    } else {
      contextPrompt += ` The questions should be warm, conversational, and help elicit personal stories about:
- Childhood memories and family
- Significant life events and relationships
- Personal growth and challenges
- Values, beliefs, and life lessons
- Dreams and aspirations`;
    }

    console.log('Requesting AI suggestions with context:', contextPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a thoughtful interviewer helping people preserve their life stories. Generate questions that are warm, open-ended, and help people share meaningful memories."
          },
          {
            role: "user",
            content: contextPrompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_questions",
              description: "Return 3-5 thoughtful interview questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Array of 3-5 open-ended interview questions"
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_questions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));
    
    // Extract questions from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }
    
    const args = typeof toolCall.function.arguments === 'string' 
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
    
    const questions = args.questions || [];
    
    console.log('Suggested questions:', questions);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in suggest-questions function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
