import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  MapPin, 
  TrendingUp, 
  Sparkles,
  Info,
  ChevronRight,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  X,
  Building2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { getAIHouseAnalysis, analyzeHouseImage, type HouseData } from "@/src/lib/geminiService";

const PROPERTY_TYPES = [
  { id: "apartment", name: "Apartment/Flat", base: 4500000 },
  { id: "house", name: "Independent House", base: 8500000 },
  { id: "villa", name: "Luxury Villa", base: 25000000 },
];

const LOCATIONS = [
  { id: "tier1", name: "Tier 1 City (Mumbai/Delhi/Bangalore)", multiplier: 1.8 },
  { id: "tier2", name: "Tier 2 City (Pune/Ahmedabad/Jaipur)", multiplier: 1.2 },
  { id: "tier3", name: "Tier 3 City/Town", multiplier: 0.8 },
  { id: "rural", name: "Rural Area", multiplier: 0.5 },
];

const CONDITIONS = [
  { id: "new", name: "Brand New", multiplier: 1.2 },
  { id: "excellent", name: "Excellent", multiplier: 1.1 },
  { id: "good", name: "Good", multiplier: 1.0 },
  { id: "fair", name: "Fair", multiplier: 0.85 },
  { id: "poor", name: "Needs Work", multiplier: 0.6 },
];

export default function HousePredictor() {
  const [data, setData] = React.useState<HouseData>({
    propertyType: "apartment",
    location: "tier1",
    condition: "good",
  });

  const [predictedPrice, setPredictedPrice] = React.useState(0);
  const [hasEstimated, setHasEstimated] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<any>(null);
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [imageDescription, setImageDescription] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Heuristic Calculation for Indian Market
  const calculatePrice = React.useCallback(() => {
    if (!hasEstimated) {
      setPredictedPrice(0);
      return;
    }
    const type = PROPERTY_TYPES.find(t => t.id === data.propertyType) || PROPERTY_TYPES[0];
    const loc = LOCATIONS.find(l => l.id === data.location) || LOCATIONS[0];
    const cond = CONDITIONS.find(c => c.id === data.condition) || CONDITIONS[2];
    
    let total = type.base * loc.multiplier * cond.multiplier;
    
    setPredictedPrice(Math.round(total));
  }, [data]);

  React.useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await getAIHouseAnalysis(data, predictedPrice);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      
      const result = await analyzeHouseImage(base64, file.type);
      if (result) {
        setHasEstimated(true);
        setData({
          propertyType: result.propertyType,
          location: result.location,
          condition: result.condition,
        });
        setImageDescription(result.description);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImageDescription(null);
    setHasEstimated(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const chartData = [
    { name: "Base Value", value: PROPERTY_TYPES.find(t => t.id === data.propertyType)?.base || 0 },
    { name: "Location Adj.", value: (PROPERTY_TYPES.find(t => t.id === data.propertyType)?.base || 0) * (LOCATIONS.find(l => l.id === data.location)?.multiplier || 1) - (PROPERTY_TYPES.find(t => t.id === data.propertyType)?.base || 0) },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center space-y-2">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-medium"
        >
          <Sparkles className="w-3 h-3" />
          Indian Real Estate AI Predictor
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">HOUSE PREDICTION AI MODEL</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Simplified property valuation for the Indian market. Upload a photo or select basic details to get an estimate.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <Card className="lg:col-span-5 border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              Property Details
            </CardTitle>
            <CardDescription>Simple inputs for quick estimation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" /> Property Photo (Optional)
              </Label>
              
              {!uploadedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center space-y-2 cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/20"
                >
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Click to upload house photo</p>
                    <p className="text-xs text-muted-foreground">AI will estimate features from the image</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                </div>
              ) : (
                <div className="relative group rounded-xl overflow-hidden border">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded house" 
                    className="w-full h-48 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      Change
                    </Button>
                    <Button size="sm" variant="destructive" onClick={clearImage}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
                      <RefreshCcw className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs font-medium">AI Analyzing Image...</p>
                    </div>
                  )}
                </div>
              )}

              {imageDescription && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[11px] italic text-muted-foreground">
                  " {imageDescription} "
                </div>
              )}

              <Separator />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Property Type
                </Label>
                <Select 
                  value={data.propertyType} 
                  onValueChange={(val) => setData(prev => ({ ...prev, propertyType: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> City/Location Category
                </Label>
                <Select 
                  value={data.location} 
                  onValueChange={(val) => setData(prev => ({ ...prev, location: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property Condition</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITIONS.map(cond => (
                    <Button
                      key={cond.id}
                      variant={data.condition === cond.id ? "default" : "outline"}
                      className="text-[10px] h-8 px-1"
                      onClick={() => setData(prev => ({ ...prev, condition: cond.id }))}
                    >
                      {cond.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-[10px] text-muted-foreground space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Info className="w-3 h-3" /> Simple Model Logic
                </p>
                <p>Price = Base Value (Type) × Location Multiplier × Condition Factor</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {!hasEstimated && (
              <Button 
                variant="outline" 
                className="w-full border-primary/20 hover:bg-primary/5"
                onClick={() => setHasEstimated(true)}
              >
                Start Manual Estimation
              </Button>
            )}
            <Button 
              className="w-full group" 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || !hasEstimated}
            >
              {isAnalyzing ? (
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isAnalyzing ? "Analyzing Market..." : "Get AI Market Analysis"}
              <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>

        {/* Results Section */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="w-32 h-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">
                Estimated Market Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={predictedPrice}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-bold font-display"
                  >
                    ₹{predictedPrice.toLocaleString('en-IN')}
                  </motion.span>
                </AnimatePresence>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  INR
                </Badge>
              </div>
              <p className="mt-4 text-primary-foreground/70 text-sm max-w-md">
                {!hasEstimated 
                  ? "Waiting for property input or photo upload to begin valuation..."
                  : `Estimate for a ${PROPERTY_TYPES.find(t => t.id === data.propertyType)?.name} in ${LOCATIONS.find(l => l.id === data.location)?.name}.`
                }
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="breakdown" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="breakdown">Value Factors</TabsTrigger>
              <TabsTrigger value="ai">AI Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="breakdown" className="mt-4">
              <Card className="overflow-hidden relative">
                {/* Scanning Grid Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{ 
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }} 
                />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Value Composition
                  </CardTitle>
                  <CardDescription>Visual breakdown of how the price is calculated.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-8 relative z-10">
                  <div className="space-y-6">
                    {chartData.map((item, index) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-muted-foreground">{item.name}</span>
                          <motion.span 
                            key={item.value}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-mono font-bold"
                          >
                            ₹{item.value.toLocaleString('en-IN')}
                          </motion.span>
                        </div>
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (item.value / predictedPrice) * 100)}%` }}
                            transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                            className="h-full bg-primary relative"
                          >
                            <motion.div 
                              animate={{ 
                                x: ["0%", "100%"],
                                opacity: [0, 1, 0]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "linear" 
                              }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-20"
                            />
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex items-center justify-center">
                    <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-primary/10 rounded-full blur-xl"
                      />
                      <div className="relative bg-background border rounded-2xl p-6 text-center shadow-inner">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Total Valuation</p>
                        <p className="text-2xl font-bold font-display">₹{predictedPrice.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <AnimatePresence mode="wait">
                {aiAnalysis ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Market Sentiment
                          </CardTitle>
                          <Badge variant="outline" className="font-mono">
                            Confidence: {aiAnalysis.confidence}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{aiAnalysis.sentiment}</p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-4 h-4" /> Pros
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs space-y-2">
                            {aiAnalysis.pros.map((pro: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-green-600">•</span> {pro}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
                            <AlertCircle className="w-4 h-4" /> Cons
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs space-y-2">
                            {aiAnalysis.cons.map((con: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-amber-600">•</span> {con}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Value-Add Suggestions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.suggestions.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="font-normal">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="p-4 rounded-full bg-muted">
                      <Info className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">No AI Analysis Yet</h3>
                      <p className="text-sm text-muted-foreground">Click the button on the left to get detailed insights from Gemini.</p>
                    </div>
                  </Card>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="pt-8 border-t text-center text-xs text-muted-foreground">
        <p>© 2026 BharatEstate AI • Built for College Assignment • Heuristic Model v2.0 (India)</p>
      </footer>
    </div>
  );
}
