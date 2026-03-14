import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Package, CreditCard, Palette } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
] as const;

const COLOR_THEMES: { value: string; label: string; bg: string; text: string; accent: string }[] = [
  { value: "classic",  label: "Classic",   bg: "#2c3e50", text: "#fdfbf7", accent: "#c5a059" },
  { value: "burgundy", label: "Burgundy",  bg: "#722F37", text: "#fdfbf7", accent: "#D4A574" },
  { value: "navy",     label: "Navy",      bg: "#1B2A4A", text: "#fdfbf7", accent: "#B8860B" },
  { value: "forest",   label: "Forest",    bg: "#2D4A3E", text: "#fdfbf7", accent: "#C5A059" },
  { value: "charcoal", label: "Charcoal",  bg: "#333333", text: "#fdfbf7", accent: "#A0A0A0" },
];

const TRIM_SIZES: { value: string; label: string }[] = [
  { value: "5.5x8.5", label: '5.5" × 8.5"' },
  { value: "6x9",     label: '6" × 9"' },
  { value: "8.5x11",  label: '8.5" × 11"' },
];

export default function PrintRequest() {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { storyGroups } = useStoryGroups();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Format
  const [format, setFormat] = useState<'hardcover' | 'paperback'>('hardcover');
  const [size, setSize] = useState<'standard' | 'large' | 'small'>('standard');
  const [quantity, setQuantity] = useState(1);

  // Step 2: Shipping
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');

  // Step 3: Cover customization
  const [coverTitle, setCoverTitle] = useState('');
  const [coverSubtitle, setCoverSubtitle] = useState('');
  const [coverColorTheme, setCoverColorTheme] = useState('classic');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [trimSize, setTrimSize] = useState('6x9');

  const book = storyGroups?.find(g => g.id === groupId);

  // Default cover title to book title on first render
  const effectiveCoverTitle = coverTitle || book?.title || "Untitled";

  if (!book) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Book not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculatePrice = () => {
    const basePrice = format === 'hardcover' ? 49.99 : 29.99;
    const sizeMultiplier = size === 'large' ? 1.5 : size === 'small' ? 0.8 : 1;
    return (basePrice * sizeMultiplier * quantity).toFixed(2);
  };

  const selectedTheme = COLOR_THEMES.find(t => t.value === coverColorTheme) || COLOR_THEMES[0];

  const handleCheckout = async () => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to continue", variant: "destructive" });
      return;
    }
    if (!shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingZip) {
      toast({ title: "Missing information", description: "Please fill in all shipping details", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-print-checkout', {
        body: {
          orderData: {
            story_group_id: book.id,
            book_title: book.title,
            format,
            size,
            quantity,
            shipping_name: shippingName,
            shipping_address: shippingAddress,
            shipping_city: shippingCity,
            shipping_state: shippingState,
            shipping_zip: shippingZip,
            shipping_country: 'US',
            // Cover customization
            trim_size: trimSize,
            cover_title: effectiveCoverTitle,
            cover_subtitle: coverSubtitle || null,
            cover_image_url: coverImageUrl || null,
            cover_color_theme: coverColorTheme,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const TOTAL_STEPS = 4;
  const stepLabels = [
    { n: 1, label: "Format" },
    { n: 2, label: "Shipping" },
    { n: 3, label: "Cover" },
    { n: 4, label: "Review" },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Order Physical Copy</CardTitle>
          <CardDescription>
            Get a beautifully printed copy of "{book.title}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {stepLabels.map((s, i, arr) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-initial">
                <div className={`flex items-center ${step >= s.n ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {s.n}
                  </div>
                  <span className="ml-2 text-sm hidden sm:inline">{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-px bg-border mx-4" />}
              </div>
            ))}
          </div>

          {/* Step 1: Format */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">Book Format</Label>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'hardcover' | 'paperback')}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                    <RadioGroupItem value="hardcover" id="hardcover" />
                    <Label htmlFor="hardcover" className="flex-1 cursor-pointer">
                      <div className="font-medium">Hardcover</div>
                      <div className="text-sm text-muted-foreground">Premium quality with durable cover</div>
                      <div className="text-sm font-semibold mt-1">$49.99</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                    <RadioGroupItem value="paperback" id="paperback" />
                    <Label htmlFor="paperback" className="flex-1 cursor-pointer">
                      <div className="font-medium">Paperback</div>
                      <div className="text-sm text-muted-foreground">Flexible and lightweight</div>
                      <div className="text-sm font-semibold mt-1">$29.99</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base mb-3 block">Book Size</Label>
                <RadioGroup value={size} onValueChange={(v) => setSize(v as 'standard' | 'large' | 'small')}>
                  {[
                    { value: 'small', label: 'Small (5.5" × 8.5")', desc: 'Compact and portable' },
                    { value: 'standard', label: 'Standard (6" × 9")', desc: 'Classic book size' },
                    { value: 'large', label: 'Large (8.5" × 11")', desc: 'Perfect for photos and detailed content' },
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="flex-1 cursor-pointer">
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-sm text-muted-foreground">{opt.desc}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min="1" max="10" value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} className="mt-2" />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => {
                  // Map size selection to trim_size
                  const sizeToTrim: Record<string, string> = { small: "5.5x8.5", standard: "6x9", large: "8.5x11" };
                  setTrimSize(sizeToTrim[size] || "6x9");
                  setStep(2);
                }}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="space-y-4">
              <div><Label htmlFor="name">Full Name</Label>
                <Input id="name" value={shippingName} onChange={(e) => setShippingName(e.target.value)} placeholder="John Doe" className="mt-2" /></div>
              <div><Label htmlFor="address">Street Address</Label>
                <Input id="address" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="123 Main St" className="mt-2" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="city">City</Label>
                  <Input id="city" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="New York" className="mt-2" /></div>
                <div><Label htmlFor="state">State</Label>
                  <Select value={shippingState} onValueChange={setShippingState}>
                    <SelectTrigger className="mt-2" id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select></div>
              </div>
              <div><Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} placeholder="10001" className="mt-2" /></div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button onClick={() => setStep(3)}>Customize Cover <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 3: Cover Customization */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Customize Your Cover</h3>
              </div>

              {/* Live Mini Preview */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-48 aspect-[6/9] rounded-r-lg shadow-xl flex flex-col justify-center items-center text-center p-5 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTheme.bg} 0%, ${selectedTheme.bg}dd 100%)`,
                    boxShadow: `-3px 0 6px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)`,
                  }}
                >
                  <div className="space-y-2.5 w-full">
                    {coverImageUrl && (
                      <div className="w-16 h-16 mx-auto rounded overflow-hidden border" style={{ borderColor: selectedTheme.accent }}>
                        <img
                          src={coverImageUrl}
                          alt="Cover"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <h4
                      className="text-sm font-bold leading-tight font-serif line-clamp-3"
                      style={{ color: selectedTheme.text }}
                    >
                      {effectiveCoverTitle}
                    </h4>
                    <div className="w-8 h-0.5 mx-auto" style={{ background: selectedTheme.accent }} />
                    {coverSubtitle && (
                      <p className="text-[10px] italic line-clamp-2" style={{ color: selectedTheme.text, opacity: 0.7 }}>
                        {coverSubtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Title */}
              <div>
                <Label htmlFor="coverTitle">Cover Title</Label>
                <Input
                  id="coverTitle"
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value.slice(0, 120))}
                  placeholder={book.title}
                  className="mt-2"
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground mt-1">{(coverTitle || "").length}/120 characters</p>
              </div>

              {/* Cover Subtitle */}
              <div>
                <Label htmlFor="coverSubtitle">Subtitle (optional)</Label>
                <Input
                  id="coverSubtitle"
                  value={coverSubtitle}
                  onChange={(e) => setCoverSubtitle(e.target.value.slice(0, 180))}
                  placeholder="A collection of memories"
                  className="mt-2"
                  maxLength={180}
                />
                <p className="text-xs text-muted-foreground mt-1">{coverSubtitle.length}/180 characters</p>
              </div>

              {/* Color Theme */}
              <div>
                <Label className="mb-3 block">Color Theme</Label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setCoverColorTheme(theme.value)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                        coverColorTheme === theme.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-md shadow-sm"
                        style={{ background: theme.bg }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-4 h-0.5 rounded" style={{ background: theme.accent }} />
                        </div>
                      </div>
                      <span className="text-xs font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trim Size (read-only, derived from step 1) */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Trim Size: {TRIM_SIZES.find(t => t.value === trimSize)?.label || trimSize}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Determined by book size selected in step 1. Go back to change it.
                </p>
              </div>

              {/* Cover Image URL */}
              <div>
                <Label htmlFor="coverImage">Cover Image URL (optional)</Label>
                <Input
                  id="coverImage"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Publicly accessible image URL. Leave empty for a text-only cover.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Back
                </Button>
                <Button onClick={() => setStep(4)}>
                  Review Order <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium">Order Details</h3>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <p>Book: {book.title}</p>
                      <p>Format: {format === 'hardcover' ? 'Hardcover' : 'Paperback'}</p>
                      <p>Size: {TRIM_SIZES.find(t => t.value === trimSize)?.label || trimSize}</p>
                      <p>Quantity: {quantity}</p>
                    </div>
                  </div>
                </div>

                {/* Cover preview in review */}
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Palette className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium">Cover Design</h3>
                    <div className="flex items-start gap-3 mt-2">
                      <div
                        className="w-16 aspect-[6/9] rounded-sm shadow flex items-center justify-center shrink-0"
                        style={{ background: selectedTheme.bg }}
                      >
                        <span className="text-[6px] font-bold text-center px-1 leading-tight line-clamp-3" style={{ color: selectedTheme.text }}>
                          {effectiveCoverTitle}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><span className="font-medium text-foreground">Title:</span> {effectiveCoverTitle}</p>
                        {coverSubtitle && <p><span className="font-medium text-foreground">Subtitle:</span> {coverSubtitle}</p>}
                        <p><span className="font-medium text-foreground">Theme:</span> {selectedTheme.label}</p>
                        {coverImageUrl && <p><span className="font-medium text-foreground">Image:</span> ✓ included</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium">Shipping Address</h3>
                    <div className="text-sm text-muted-foreground mt-2">
                      <p>{shippingName}</p>
                      <p>{shippingAddress}</p>
                      <p>{shippingCity}, {shippingState} {shippingZip}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>${calculatePrice()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Includes printing, binding, and shipping</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button onClick={handleCheckout} disabled={loading}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {loading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
