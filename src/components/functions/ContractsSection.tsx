
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Deploy, FileCode, FileText, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { deployContract, sendContractTransaction, estimateContractGas } from '@/utils/blockchain';
import useWeb3 from '@/hooks/useWeb3';
import useTransactionQueue from '@/hooks/useTransactionQueue';

const ContractsSection: React.FC = () => {
  const { web3, isReady, address, chainId } = useWeb3();
  const { addTransaction } = useTransactionQueue();
  
  const [contractAddress, setContractAddress] = useState<string>('');
  const [functionName, setFunctionName] = useState<string>('');
  const [functionArgs, setFunctionArgs] = useState<string>('');
  const [functionValue, setFunctionValue] = useState<string>('0');
  const [abi, setAbi] = useState<string>('');
  const [bytecode, setBytecode] = useState<string>('');
  const [constructorArgs, setConstructorArgs] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);

  const handleEstimateGas = async () => {
    if (!web3 || !isReady || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to interact with contracts.",
        variant: "destructive",
      });
      return;
    }

    if (!contractAddress || !functionName) {
      toast({
        title: "Missing information",
        description: "Please provide a contract address and function name.",
        variant: "destructive",
      });
      return;
    }

    try {
      let parsedArgs: any[] = [];
      if (functionArgs.trim()) {
        try {
          parsedArgs = JSON.parse(`[${functionArgs}]`);
        } catch (error) {
          toast({
            title: "Invalid arguments",
            description: "Please provide valid JSON arguments.",
            variant: "destructive",
          });
          return;
        }
      }

      let parsedAbi: any[] = [];
      try {
        parsedAbi = JSON.parse(abi);
        if (!Array.isArray(parsedAbi)) {
          throw new Error("ABI must be an array");
        }
      } catch (error) {
        toast({
          title: "Invalid ABI",
          description: "Please provide a valid JSON ABI.",
          variant: "destructive",
        });
        return;
      }

      const estimatedGas = await estimateContractGas(
        web3,
        address,
        contractAddress,
        parsedAbi,
        functionName,
        parsedArgs,
        functionValue
      );

      setGasEstimate(estimatedGas);
      
      toast({
        title: "Gas Estimation",
        description: `Estimated gas: ${estimatedGas}`,
      });
    } catch (error) {
      console.error("Error estimating gas:", error);
      
      toast({
        title: "Gas Estimation Error",
        description: error instanceof Error ? error.message : "Failed to estimate gas.",
        variant: "destructive",
      });
    }
  };

  const handleSendTransaction = async () => {
    if (!web3 || !isReady || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to interact with contracts.",
        variant: "destructive",
      });
      return;
    }

    if (!contractAddress || !functionName) {
      toast({
        title: "Missing information",
        description: "Please provide contract address and function name.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      let parsedArgs: any[] = [];
      if (functionArgs.trim()) {
        try {
          parsedArgs = JSON.parse(`[${functionArgs}]`);
        } catch (error) {
          toast({
            title: "Invalid arguments",
            description: "Please provide valid JSON arguments.",
            variant: "destructive",
          });
          setIsSending(false);
          return;
        }
      }

      let parsedAbi: any[] = [];
      try {
        parsedAbi = JSON.parse(abi);
        if (!Array.isArray(parsedAbi)) {
          throw new Error("ABI must be an array");
        }
      } catch (error) {
        toast({
          title: "Invalid ABI",
          description: "Please provide a valid JSON ABI.",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      const receipt = await sendContractTransaction(
        web3,
        address,
        contractAddress,
        parsedAbi,
        functionName,
        parsedArgs,
        functionValue
      );

      // Add transaction to the queue
      if (receipt && receipt.transactionHash) {
        addTransaction({
          hash: receipt.transactionHash,
          from: address,
          to: contractAddress,
          value: functionValue,
          chainId: String(chainId),
          type: "contract",
          status: "confirmed",
          method: functionName,
          timestamp: Date.now()
        });
        
        toast({
          title: "Transaction Sent",
          description: `Transaction has been sent successfully.`,
        });
      }
    } catch (error) {
      console.error("Error sending contract transaction:", error);
      
      toast({
        title: "Transaction Error",
        description: error instanceof Error ? error.message : "Failed to send transaction.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeployContract = async () => {
    if (!web3 || !isReady || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to deploy a contract.",
        variant: "destructive",
      });
      return;
    }

    if (!bytecode) {
      toast({
        title: "Missing bytecode",
        description: "Please provide contract bytecode.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);

    try {
      let parsedAbi: any[] = [];
      try {
        parsedAbi = JSON.parse(abi);
        if (!Array.isArray(parsedAbi)) {
          throw new Error("ABI must be an array");
        }
      } catch (error) {
        toast({
          title: "Invalid ABI",
          description: "Please provide a valid JSON ABI.",
          variant: "destructive",
        });
        setIsDeploying(false);
        return;
      }

      let parsedArgs: any[] = [];
      if (constructorArgs.trim()) {
        try {
          parsedArgs = JSON.parse(`[${constructorArgs}]`);
        } catch (error) {
          toast({
            title: "Invalid constructor arguments",
            description: "Please provide valid JSON arguments.",
            variant: "destructive",
          });
          setIsDeploying(false);
          return;
        }
      }

      const receipt = await deployContract(
        web3,
        address,
        parsedAbi,
        bytecode,
        parsedArgs
      );

      if (receipt && receipt.contractAddress) {
        setContractAddress(receipt.contractAddress);
        
        // Add deployment transaction to the queue
        if (receipt.transactionHash) {
          addTransaction({
            hash: receipt.transactionHash,
            from: address,
            to: receipt.contractAddress,
            value: "0",
            chainId: String(chainId),
            type: "deploy",
            status: "confirmed",
            method: "constructor",
            timestamp: Date.now()
          });
        }
        
        toast({
          title: "Contract Deployed",
          description: `Contract deployed at ${receipt.contractAddress}`,
        });
      }
    } catch (error) {
      console.error("Error deploying contract:", error);
      
      toast({
        title: "Deployment Error",
        description: error instanceof Error ? error.message : "Failed to deploy contract.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          Smart Contracts
        </CardTitle>
        <CardDescription>
          Deploy smart contracts and interact with existing contracts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="interact">
          <TabsList className="grid grid-cols-2 mb-4 w-full sm:w-[300px]">
            <TabsTrigger value="interact">
              <Send className="h-4 w-4 mr-2" />
              Interact
            </TabsTrigger>
            <TabsTrigger value="deploy">
              <Deploy className="h-4 w-4 mr-2" />
              Deploy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="interact" className="space-y-4">
            <Input
              placeholder="Contract Address (0x...)"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
            
            <div className="space-y-2">
              <Textarea
                placeholder="Contract ABI (JSON array)"
                value={abi}
                onChange={(e) => setAbi(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="text-xs text-muted-foreground">
                <p>Paste the contract ABI as a JSON array</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Function Name"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
              />
              <Input
                placeholder="Value (ETH)"
                type="number"
                min="0"
                step="0.01"
                value={functionValue}
                onChange={(e) => setFunctionValue(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Function Arguments (comma-separated, JSON format)"
                value={functionArgs}
                onChange={(e) => setFunctionArgs(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="text-xs text-muted-foreground">
                <p>Example: "0x123...", 100, true</p>
              </div>
            </div>
            
            {gasEstimate && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Estimated Gas: {gasEstimate}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="deploy" className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Contract ABI (JSON array)"
                value={abi}
                onChange={(e) => setAbi(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="text-xs text-muted-foreground">
                <p>Paste the contract ABI as a JSON array</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Contract Bytecode (0x...)"
                value={bytecode}
                onChange={(e) => setBytecode(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="text-xs text-muted-foreground">
                <p>Paste the compiled contract bytecode</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Constructor Arguments (comma-separated, JSON format)"
                value={constructorArgs}
                onChange={(e) => setConstructorArgs(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="text-xs text-muted-foreground">
                <p>Example: "0x123...", 100, true</p>
              </div>
            </div>
            
            <Button 
              onClick={handleDeployContract} 
              className="w-full"
              disabled={!isReady || isDeploying || !bytecode}
            >
              {isDeploying ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deploying...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Deploy Contract
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={handleEstimateGas}
          disabled={!isReady || !contractAddress || !functionName}
        >
          Estimate Gas
        </Button>
        <Button 
          className="w-full sm:w-auto"
          onClick={handleSendTransaction}
          disabled={!isReady || isSending || !contractAddress || !functionName}
        >
          {isSending ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Transaction
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ContractsSection;
