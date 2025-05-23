
"use client"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, LayoutDashboard, MessageCircle, Zap, Lightbulb } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { mainnet, polygon, optimism, arbitrum, base, zora, bsc } from "wagmi/chains"

// Custom EduChain definition for the header
const educhain = {
  id: 11155111,
  name: 'EduChain',
  nativeCurrency: {
    decimals: 18,
    name: 'EduChain',
    symbol: 'EDU',
  },
  rpcUrls: {
    default: { http: ['https://rpc.edutestnet.io'] },
  }
};

const Header = () => {
  const { theme, setTheme } = useTheme()
  const { isConnected, address } = useAccount()
  const location = useLocation()

  return (
    <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm animate-in fade-in-10 h-16">
      <div className="container mx-auto px-6 h-full flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 transition-colors hover:opacity-90">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              NovachatV2
            </h1>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/" && "bg-accent/50"
                    )}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/chat">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/chat" && "bg-accent/50",
                      "flex items-center gap-1"
                    )}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/functions">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/functions" && "bg-accent/50",
                      "flex items-center gap-1"
                    )}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Functions
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/web3-intro">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/web3-intro" && "bg-accent/50",
                      "flex items-center gap-1"
                    )}
                  >
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Web3 Intro
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/20 p-1.5 px-2 rounded-full transition-colors">
            {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
              className="data-[state=checked]:bg-primary/70"
            />
          </div>

          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                  className="animate-in fade-in-50 slide-in-from-right-5"
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <Button onClick={openConnectModal} type="button" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                          Connect Wallet
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button onClick={openChainModal} type="button" variant="destructive" className="animate-pulse">
                          Wrong network
                        </Button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={openChainModal}
                          type="button"
                          variant="outline"
                          className="flex items-center gap-1 bg-secondary/30 border-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          {chain.hasIcon && (
                            <div className="w-4 h-4 mr-1">
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className="w-4 h-4"
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </Button>

                        <Button
                          onClick={openAccountModal}
                          type="button"
                          variant="secondary"
                          className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                        >
                          <Avatar className="w-5 h-5 mr-1">
                            <AvatarFallback className="bg-primary/30 text-xs">
                              {account.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {account.displayName}
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  )
}

export default Header;
