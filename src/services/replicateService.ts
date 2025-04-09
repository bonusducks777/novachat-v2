
import { toast } from "@/components/ui/use-toast";

interface ReplicateResponse {
  id: string;
  output: string;
  error?: string;
  status: string;
}

export interface FlockWeb3Request {
  query: string;
  tools: string;
  top_p?: number;
  temperature?: number;
  max_new_tokens?: number;
}

// Get Replicate API token from localStorage
const getReplicateApiToken = (): string => {
  try {
    const apiKeys = localStorage.getItem('apiKeys');
    if (apiKeys) {
      const parsed = JSON.parse(apiKeys);
      return parsed.replicate || "";
    }
  } catch (error) {
    console.error("Error retrieving Replicate API token:", error);
  }
  return "";
};

export const callFlockWeb3 = async (input: FlockWeb3Request): Promise<string> => {
  try {
    const REPLICATE_API_TOKEN = getReplicateApiToken();
    
    if (!REPLICATE_API_TOKEN) {
      toast({
        title: "API Token Missing",
        description: "Please provide a Replicate API token in the settings",
        variant: "destructive",
      });
      return "Error: Please provide a Replicate API token in the settings";
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({
        version: "3babfa32ab245cf8e047ff7366bcb4d5a2b4f0f108f504c47d5a84e23c02ff5f",
        input: {
          query: input.query,
          tools: input.tools,
          top_p: input.top_p || 0.9,
          temperature: input.temperature || 0.7,
          max_new_tokens: input.max_new_tokens || 3000,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Replicate API Error:", errorData);
      throw new Error(errorData.detail || "Failed to call Flock Web3 model");
    }

    const prediction: ReplicateResponse = await response.json();
    
    // Check if we need to poll for results
    if (prediction.status === "starting" || prediction.status === "processing") {
      return await pollForCompletion(prediction.id);
    }
    
    return prediction.output || "No response from model";
  } catch (error) {
    console.error("Error calling Flock Web3 model:", error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

// Poll for completion of a prediction
const pollForCompletion = async (predictionId: string): Promise<string> => {
  const maxAttempts = 50;
  const delay = 1000; // 1 second delay between polls
  const REPLICATE_API_TOKEN = getReplicateApiToken();
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to poll prediction status");
      }
      
      const prediction: ReplicateResponse = await response.json();
      
      if (prediction.status === "succeeded") {
        return prediction.output || "No output from model";
      } else if (prediction.status === "failed" || prediction.status === "canceled") {
        throw new Error(prediction.error || "Prediction failed");
      }
      // Continue polling if status is "starting" or "processing"
    } catch (error) {
      console.error("Error polling for prediction:", error);
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
  
  return "Timeout: Prediction took too long to complete";
};

// Create default web3 tools JSON string
export const createDefaultWeb3Tools = (): string => {
  const tools = {
    "blockchain_tools": {
      "get_token_price": {
        "description": "Get the price of a token in USD",
        "parameters": {
          "token_symbol": {
            "type": "string",
            "description": "The token symbol (e.g., ETH, BTC, SOL)"
          }
        }
      },
      "get_gas_price": {
        "description": "Get the current gas price in Gwei",
        "parameters": {
          "chain": {
            "type": "string",
            "description": "The blockchain to get gas price for (e.g., ethereum, binance)"
          }
        }
      },
      "send_token": {
        "description": "Send tokens to an address",
        "parameters": {
          "token_address": {
            "type": "string",
            "description": "The token address (use 'native' for ETH, BNB, etc.)"
          },
          "to_address": {
            "type": "string",
            "description": "The recipient address"
          },
          "amount": {
            "type": "string",
            "description": "The amount to send"
          }
        }
      },
      "swap_tokens": {
        "description": "Swap tokens on a decentralized exchange",
        "parameters": {
          "token_in": {
            "type": "string",
            "description": "The input token address or symbol"
          },
          "token_out": {
            "type": "string",
            "description": "The output token address or symbol"
          },
          "amount_in": {
            "type": "string",
            "description": "The input amount"
          }
        }
      },
      "add_liquidity": {
        "description": "Add liquidity to a DEX pool",
        "parameters": {
          "token_a": {
            "type": "string",
            "description": "First token address or symbol"
          },
          "token_b": {
            "type": "string",
            "description": "Second token address or symbol"
          },
          "amount_a": {
            "type": "string",
            "description": "Amount of first token"
          },
          "amount_b": {
            "type": "string",
            "description": "Amount of second token"
          }
        }
      },
      "get_token_balance": {
        "description": "Get token balance for an address",
        "parameters": {
          "token_address": {
            "type": "string",
            "description": "The token address (use 'native' for ETH, BNB, etc.)"
          },
          "wallet_address": {
            "type": "string",
            "description": "The wallet address to check balance for"
          }
        }
      }
    },
    "transaction_tools": {
      "explain_transaction": {
        "description": "Explain a blockchain transaction",
        "parameters": {
          "transaction_hash": {
            "type": "string",
            "description": "The transaction hash to explain"
          },
          "chain_id": {
            "type": "string",
            "description": "The chain ID (e.g., 1 for Ethereum, 56 for BSC)"
          }
        }
      },
      "estimate_gas": {
        "description": "Estimate gas cost for a transaction",
        "parameters": {
          "from_address": {
            "type": "string",
            "description": "The sender address"
          },
          "to_address": {
            "type": "string",
            "description": "The recipient address"
          },
          "data": {
            "type": "string",
            "description": "The transaction data (hex)"
          },
          "value": {
            "type": "string",
            "description": "The transaction value in wei"
          }
        }
      }
    }
  };
  
  return JSON.stringify(tools);
};
