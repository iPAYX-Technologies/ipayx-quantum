import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { PRICING } from "@/lib/savingsWidget.config";
import ComparisonCard from "@/components/ComparisonCard";
import SavingsSummary from "@/components/SavingsSummary";

export default function ROICalculator() {
  const { t, language } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState(200_000_000); // Default $200M
  const [transitDays, setTransitDays] = useState("3");
  const [interestRate, setInterestRate] = useState({ "2": true, "3": false, "4": false });
  const [supplierWaiting, setSupplierWaiting] = useState("yes");
  const [usingCredit, setUsingCredit] = useState<string>("no");
  const [creditRate, setCreditRate] = useState(10);
  const [opportunityRate, setOpportunityRate] = useState(7); // 7% opportunity cost by default
  const [breakdown, setBreakdown] = useState<{
    feeSavings: number;
    capitalFreed: number;
    creditAvoided: number;
    supplierImpact: number;
  } | null>(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [legacyData, setLegacyData] = useState<any>(null);
  const [ipayxData, setIpayxData] = useState<any>(null);

  const calculateSavings = () => {
    // ============================================
    // FORMULES CASHFLOW COMPLÈTES - iPayX Protocol V4
    // ============================================
    
    // 1. ÉCONOMIE DE FRAIS (70% max: 3% → 0.7%) - Using centralized config
    const ipayxFee = amount * PRICING.IPAYX_FLAT_FEE;
    const legacyFeeMin = amount * PRICING.LEGACY_MIN_ALL_IN;
    const legacyFeeMax = amount * PRICING.LEGACY_MAX_ALL_IN;
    const feeSavingsMin = legacyFeeMin - ipayxFee;
    const feeSavingsMax = legacyFeeMax - ipayxFee;
    const feeSavings = (feeSavingsMin + feeSavingsMax) / 2; // Moyenne
    
    // 2. COÛT CAPITAL GELÉ (délai 3-5j)
    const selectedRate = Object.keys(interestRate).find(k => interestRate[k as keyof typeof interestRate]);
    const interestRatePct = selectedRate ? parseFloat(selectedRate) / 100 : 0.025;
    const transitDaysNum = parseInt(transitDays);
    const opportunityCostLegacy = amount * interestRatePct * (transitDaysNum / 365);
    const opportunityCostIpayx = amount * interestRatePct * (8 / 86400 / 365);
    const capitalFreed = opportunityCostLegacy - opportunityCostIpayx;
    
    // 3. PÉNALITÉ FOURNISSEUR
    const supplierImpact = supplierWaiting === "yes" 
      ? opportunityCostLegacy * 0.5 
      : 0;
    
    // 4. COÛT CRÉDIT/MARGE OU OPPORTUNITÉ
    // Si utilise crédit → coût du crédit
    // Si n'utilise pas crédit → coût d'opportunité du capital immobilisé
    const creditAvoided = usingCredit === "yes"
      ? amount * (creditRate / 100) * (transitDaysNum / 365)
      : amount * (opportunityRate / 100) * (transitDaysNum / 365);
    
    // 5. TOTAL
    const totalSavingsCalc = feeSavings + capitalFreed + supplierImpact + creditAvoided;
    
    setTotalSavings(totalSavingsCalc);
    setBreakdown({
      feeSavings,
      capitalFreed,
      creditAvoided,
      supplierImpact
    });

    // Legacy data - creditAvoided includes both credit and opportunity cost now
    const legacyTotal = opportunityCostLegacy + legacyFeeMax + creditAvoided + supplierImpact;
    setLegacyData({
      transitTime: `${transitDaysNum} days`,
      fees: legacyFeeMax,
      frozenCapital: opportunityCostLegacy,
      creditCost: creditAvoided, // Always includes cost (credit or opportunity)
      total: legacyTotal
    });

    // iPayX data
    const ipayxTotal = opportunityCostIpayx + ipayxFee;
    setIpayxData({
      transitTime: "8 seconds",
      fees: ipayxFee,
      frozenCapital: opportunityCostIpayx,
      creditCost: 0,
      total: ipayxTotal
    });
    
  };

  // Auto-calculate on input change
  useEffect(() => {
    calculateSavings();
  }, [amount, transitDays, interestRate, supplierWaiting, usingCredit, creditRate, opportunityRate]);

  const handleDownloadReport = async () => {
    if (!cardRef.current || !breakdown) {
      toast.error("Please calculate savings first");
      return;
    }

    try {
      toast.info("Generating PDF report...");
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0A0F1C",
        scale: 2
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`ipayx-roi-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("PDF report downloaded!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Card ref={cardRef} className="p-8 bg-card/50 backdrop-blur-sm border-border/40">
      <h3 className="text-3xl font-bold text-foreground mb-8 text-center">
        {t.roiCalculator.title}
      </h3>

      {/* 2-Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT PANEL - Inputs */}
        <div className="space-y-6">
          {/* Slider Montant */}
      <div className="space-y-4 mb-6">
        <Label className="text-lg">{t.roiCalculator.annualAmount}</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[amount]}
            onValueChange={([v]) => setAmount(v)}
            min={100_000}
            max={500_000_000}
            step={100_000}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-primary min-w-[120px]">
            ${amount >= 1_000_000 
              ? (amount % 1_000_000 === 0 
                  ? `${(amount / 1_000_000).toFixed(0)}M` 
                  : `${(amount / 1_000_000).toFixed(1)}M`)
              : `${(amount / 1_000).toFixed(0)}k`}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">{t.roiCalculator.orEnter}</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={100_000}
            max={500_000_000}
            step={100_000}
            className="w-40 px-3 py-2 rounded-lg border border-primary/30 bg-background text-foreground text-center"
          />
        </div>
      </div>

      {/* Dropdown Temps transit */}
      <div className="space-y-4 mb-6">
        <Label className="text-lg">{t.roiCalculator.transitTime}</Label>
        <Select value={transitDays} onValueChange={setTransitDays}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 {t.roiCalculator.day}</SelectItem>
            <SelectItem value="2">2 {t.roiCalculator.days}</SelectItem>
            <SelectItem value="3">3 {t.roiCalculator.days}</SelectItem>
            <SelectItem value="4">4 {t.roiCalculator.days}</SelectItem>
            <SelectItem value="5">5 {t.roiCalculator.days}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interest Rate - Manual Input + Quick Select */}
      <div className="space-y-4 mb-6">
        <Label htmlFor="interestRateManual" className="text-lg">{t.roiCalculator.interestRate}</Label>
        
        {/* Quick select buttons */}
        <div className="flex gap-3">
          {["2", "3", "4"].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setInterestRate({
                "2": rate === "2",
                "3": rate === "3",
                "4": rate === "4",
              })}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                interestRate[rate as keyof typeof interestRate]
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-muted hover:border-primary/50'
              }`}
            >
              {rate}%
            </button>
          ))}
        </div>
        
        {/* Manual input */}
        <div className="space-y-2">
          <Label htmlFor="interestRateManual" className="text-sm text-muted-foreground">
            {language === 'fr' ? '✏️ Ou entrez votre propre taux:' : '✏️ Or enter your own rate:'}
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="interestRateManual"
              type="number"
              min="0"
              max="20"
              step="0.1"
              placeholder="Ex: 2.5"
              onChange={(e) => {
                const customRate = e.target.value;
                if (customRate) {
                  // Set all to false when using custom input
                  setInterestRate({ "2": false, "3": false, "4": false });
                }
              }}
              className="w-32 px-4 py-2 border-2 border-primary/50 rounded-lg bg-background text-foreground text-center font-bold"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'fr' 
              ? '💡 Tapez n\'importe quel taux personnalisé (ex: 2.5%, 3.75%, etc.)' 
              : '💡 Type any custom rate (e.g., 2.5%, 3.75%, etc.)'}
          </p>
        </div>
      </div>

      {/* Radio Fournisseur attend paiement */}
      <div className="space-y-4 mb-6">
        <Label className="text-lg">{t.roiCalculator.supplierWaiting}</Label>
        <RadioGroup value={supplierWaiting} onValueChange={setSupplierWaiting}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="supplier-yes" />
            <Label htmlFor="supplier-yes">{t.roiCalculator.yes}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="supplier-no" />
            <Label htmlFor="supplier-no">{t.roiCalculator.no}</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Radio Utilisation crédit/marge */}
      <div className="space-y-4 mb-6">
        <Label className="text-lg font-semibold">
          {t.roiCalculator.usingCredit}
        </Label>
        <RadioGroup value={usingCredit} onValueChange={setUsingCredit}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="credit-yes" />
            <Label htmlFor="credit-yes">{t.roiCalculator.yes}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="credit-no" />
            <Label htmlFor="credit-no">{t.roiCalculator.no}</Label>
          </div>
        </RadioGroup>
      </div>

          {/* Input Taux crédit/marge (conditionnel) */}
          {usingCredit === "yes" && (
            <div className="space-y-4 mb-6 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <Label htmlFor="creditRate" className="text-lg font-semibold flex items-center gap-2">
                💰 {t.roiCalculator.creditRate}
              </Label>
              <div className="space-y-3">
                {/* Slider */}
                <div className="flex items-center gap-4">
                  <Slider
                    value={[creditRate]}
                    onValueChange={([v]) => setCreditRate(v)}
                    min={0}
                    max={25}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-primary min-w-[80px]">
                    {creditRate}%
                  </span>
                </div>
                {/* Input manuel */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t.roiCalculator.orEnter}</span>
                  <input
                    id="creditRate"
                    type="number"
                    min="0"
                    max="30"
                    step="0.25"
                    value={creditRate}
                    onChange={(e) => setCreditRate(parseFloat(e.target.value) || 10)}
                    className="w-32 px-4 py-2 border-2 border-primary/50 rounded-lg bg-background text-foreground text-center font-bold"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 {t.roiCalculator.creditRateDescription || "Enter your actual line of credit interest rate (e.g., 8.5%, 12%, 15%)"}
              </p>
            </div>
          )}

          {/* Input Taux opportunité (si pas de crédit) */}
          {usingCredit === "no" && (
            <div className="space-y-4 mb-6 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <Label htmlFor="opportunityRate" className="text-lg font-semibold flex items-center gap-2">
                📊 {t.roiCalculator.opportunityRate}
              </Label>
              <div className="space-y-3">
                {/* Slider */}
                <div className="flex items-center gap-4">
                  <Slider
                    value={[opportunityRate]}
                    onValueChange={([v]) => setOpportunityRate(v)}
                    min={0}
                    max={25}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-primary min-w-[80px]">
                    {opportunityRate}%
                  </span>
                </div>
                {/* Input manuel */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t.roiCalculator.orEnter}</span>
                  <input
                    id="opportunityRate"
                    type="number"
                    min="0"
                    max="30"
                    step="0.25"
                    value={opportunityRate}
                    onChange={(e) => setOpportunityRate(parseFloat(e.target.value) || 7)}
                    className="w-32 px-4 py-2 border-2 border-primary/50 rounded-lg bg-background text-foreground text-center font-bold"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.roiCalculator.opportunityRateDescription}
              </p>
            </div>
          )}

          {/* Download Report Button */}
          <Button
            onClick={handleDownloadReport}
            size="lg"
            variant="outline"
            className="w-full border-primary/50 hover:border-primary"
            disabled={!breakdown}
          >
            <Download className="h-5 w-5 mr-2" />
            {t.roiCalculator.downloadReport}
          </Button>
        </div>

        {/* RIGHT PANEL - Comparison */}
        <div className="space-y-6">
          {legacyData && ipayxData && breakdown && (
            <>
              <ComparisonCard 
                type="legacy" 
                data={legacyData}
                amount={amount}
              />
              
              <ComparisonCard 
                type="ipayx" 
                data={ipayxData}
                amount={amount}
              />
              
              <SavingsSummary 
                savings={totalSavings}
                breakdown={breakdown}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
