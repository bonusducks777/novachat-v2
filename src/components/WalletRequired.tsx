
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { useAccount, useConnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletRequired = () => {
  const { isConnected } = useAccount();
  
  return (
    <Card className="w-full max-w-md mx-auto border shadow-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="text-primary" size={24} />
        </div>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          You need to connect a Web3 wallet to use the AI chat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Click the button below to connect your wallet and get started.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            return (
              <div className="flex flex-col items-center">
                {(() => {
                  if (!mounted) {
                    return (
                      <Button disabled>
                        <Wallet className="mr-2" size={16} />
                        Loading...
                      </Button>
                    )
                  }
                  
                  if (account && chain) {
                    return null; // User is already connected, should never reach here
                  }
                  
                  return (
                    <Button onClick={openConnectModal} className="gap-2">
                      <Wallet size={16} />
                      Connect Wallet
                    </Button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </CardFooter>
    </Card>
  );
};

export default WalletRequired;
