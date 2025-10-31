import { useState } from "react";
import { Search, Filter, TrendingUp, Clock, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import chainsData from "@/data/chains.json";

export default function Chains() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const filteredChains = chainsData
    .filter((chain) => {
      const matchesSearch = chain.name.toLowerCase().includes(search.toLowerCase()) ||
                           chain.symbol.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || chain.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "fee") return a.transferFee - b.transferFee;
      if (sortBy === "throughput") return b.throughput - a.throughput;
      return 0;
    });

  const chainTypes = ["all", ...Array.from(new Set(chainsData.map(c => c.type)))];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 pt-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
            Supported Chains
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose from {chainsData.length} blockchain networks for your stablecoin transfers
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chains..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-background/50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="All Types" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {chainTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="fee">Transfer Fee</SelectItem>
                  <SelectItem value="throughput">Throughput</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChains.map((chain) => (
            <Card 
              key={chain.id} 
              className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: chain.color }}
                    >
                      {chain.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{chain.name}</h3>
                      <p className="text-sm text-muted-foreground">{chain.symbol}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {chain.type}
                  </Badge>
                </div>

                {/* Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">$</span> Transfer Fee
                    </span>
                    <span className="font-medium">${chain.transferFee}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Confirmation
                    </span>
                    <span className="font-medium">{chain.confirmation}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Throughput
                    </span>
                    <span className="font-medium">{chain.throughput.toLocaleString()} TPS</span>
                  </div>
                </div>

                {/* Stablecoins */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Supported Stablecoins:</p>
                  <div className="flex flex-wrap gap-2">
                    {chain.stablecoins.map((coin) => (
                      <Badge key={coin} variant="outline" className="text-xs">
                        {coin}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                  variant="outline"
                >
                  Select Chain
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredChains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No chains found matching your criteria</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
