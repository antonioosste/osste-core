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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Package, CreditCard } from "lucide-react";

export default function PrintRequest() {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { storyGroups } = useStoryGroups();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [format, setFormat] = useState<'hardcover' | 'paperback'>('hardcover');
  const [size, setSize] = useState<'standard' | 'large' | 'small'>('standard');
  const [quantity, setQuantity] = useState(1);
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');

  const book = storyGroups?.find(g => g.id === groupId);

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

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    // Validate shipping info
    if (!shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingZip) {
      toast({
        title: "Missing information",
        description: "Please fill in all shipping details",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
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
      };

      const { data, error } = await supabase.functions.invoke('create-print-checkout', {
        body: { orderData },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
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

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-6"
      >
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
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="ml-2 text-sm">Format</span>
            </div>
            <div className="flex-1 h-px bg-border mx-4" />
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="ml-2 text-sm">Shipping</span>
            </div>
            <div className="flex-1 h-px bg-border mx-4" />
            <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="ml-2 text-sm">Review</span>
            </div>
          </div>

          {/* Step 1: Format Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">Book Format</Label>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="hardcover" id="hardcover" />
                    <Label htmlFor="hardcover" className="flex-1 cursor-pointer">
                      <div className="font-medium">Hardcover</div>
                      <div className="text-sm text-muted-foreground">Premium quality with durable cover</div>
                      <div className="text-sm font-semibold mt-1">$49.99</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
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
                <RadioGroup value={size} onValueChange={(v) => setSize(v as any)}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small" className="flex-1 cursor-pointer">
                      <div className="font-medium">Small (5" × 8")</div>
                      <div className="text-sm text-muted-foreground">Compact and portable</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="flex-1 cursor-pointer">
                      <div className="font-medium">Standard (6" × 9")</div>
                      <div className="text-sm text-muted-foreground">Classic book size</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large" className="flex-1 cursor-pointer">
                      <div className="font-medium">Large (8.5" × 11")</div>
                      <div className="text-sm text-muted-foreground">Perfect for photos and detailed content</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="New York"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    placeholder="NY"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={shippingZip}
                  onChange={(e) => setShippingZip(e.target.value)}
                  placeholder="10001"
                  className="mt-2"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Review Order
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Checkout */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium">Order Details</h3>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <p>Book: {book.title}</p>
                      <p>Format: {format === 'hardcover' ? 'Hardcover' : 'Paperback'}</p>
                      <p>Size: {size === 'small' ? 'Small (5" × 8")' : size === 'large' ? 'Large (8.5" × 11")' : 'Standard (6" × 9")'}</p>
                      <p>Quantity: {quantity}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Includes printing, binding, and shipping
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
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