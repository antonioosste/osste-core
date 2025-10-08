import { useState } from "react";
import { Lock, Plus, Edit, Trash2, DollarSign, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";

export default function Admin() {
  const { toast } = useToast();
  const { isAdmin, loading } = useAdminRole();
  
  // Mock data for prompt templates
  const [promptTemplates, setPromptTemplates] = useState([
    {
      id: 1,
      name: "Story Generation",
      category: "Story",
      prompt: "Generate a heartwarming family story based on the following details...",
      isActive: true,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Interview Questions",
      category: "Interview",
      prompt: "Create thoughtful interview questions to help capture memories about...",
      isActive: true,
      createdAt: "2024-01-10"
    },
    {
      id: 3,
      name: "Book Summary",
      category: "Book",
      prompt: "Create a compelling summary for a family story book that includes...",
      isActive: false,
      createdAt: "2024-01-05"
    }
  ]);

  // Mock data for pricing
  const [pricingPlans, setPricingPlans] = useState([
    {
      id: 1,
      name: "Basic Plan",
      price: 9.99,
      interval: "month",
      features: ["5 stories/month", "Basic templates", "Email support"],
      isActive: true,
      stripePriceId: "price_basic123"
    },
    {
      id: 2,
      name: "Family Plan",
      price: 24.99,
      interval: "month",
      features: ["15 stories/month", "Advanced templates", "Priority support", "Family sharing"],
      isActive: true,
      stripePriceId: "price_family456"
    },
    {
      id: 3,
      name: "Enterprise",
      price: 99.99,
      interval: "month",
      features: ["Unlimited stories", "Custom templates", "24/7 support", "White-label"],
      isActive: false,
      stripePriceId: "price_enterprise789"
    }
  ]);

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const handleDeleteTemplate = (id) => {
    setPromptTemplates(templates => templates.filter(t => t.id !== id));
    toast({
      title: "Template deleted",
      description: "Prompt template has been successfully deleted.",
    });
  };

  const handleDeletePlan = (id) => {
    setPricingPlans(plans => plans.filter(p => p.id !== id));
    toast({
      title: "Plan deleted", 
      description: "Pricing plan has been successfully deleted.",
    });
  };

  const handleSaveTemplate = (templateData) => {
    if (editingTemplate) {
      setPromptTemplates(templates => 
        templates.map(t => t.id === editingTemplate.id ? { ...t, ...templateData } : t)
      );
      toast({
        title: "Template updated",
        description: "Prompt template has been successfully updated.",
      });
    } else {
      const newTemplate = {
        id: Date.now(),
        ...templateData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setPromptTemplates(templates => [...templates, newTemplate]);
      toast({
        title: "Template created",
        description: "New prompt template has been successfully created.",
      });
    }
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSavePlan = (planData) => {
    if (editingPlan) {
      setPricingPlans(plans => 
        plans.map(p => p.id === editingPlan.id ? { ...p, ...planData } : p)
      );
      toast({
        title: "Plan updated",
        description: "Pricing plan has been successfully updated.",
      });
    } else {
      const newPlan = {
        id: Date.now(),
        ...planData
      };
      setPricingPlans(plans => [...plans, newPlan]);
      toast({
        title: "Plan created",
        description: "New pricing plan has been successfully created.",
      });
    }
    setIsPlanDialogOpen(false);
    setEditingPlan(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center">
            <p className="text-muted-foreground">Verifying permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Access denied view for non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-6">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">
              Admin Access Only
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              You need administrator privileges to access this area.
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Restricted Area</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The admin panel is only accessible to authorized personnel. If you believe 
                  you should have access to this area, please contact your system administrator.
                </p>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard view
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage prompt templates and pricing plans
          </p>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Prompt Templates</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Prompt Templates
                  </CardTitle>
                  <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingTemplate(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Template
                      </Button>
                    </DialogTrigger>
                    <TemplateDialog 
                      template={editingTemplate}
                      onSave={handleSaveTemplate}
                      onClose={() => setIsTemplateDialogOpen(false)}
                    />
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promptTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.category}</TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{template.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTemplate(template);
                                setIsTemplateDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pricing Plans
                  </CardTitle>
                  <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingPlan(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plan
                      </Button>
                    </DialogTrigger>
                    <PlanDialog 
                      plan={editingPlan}
                      onSave={handleSavePlan}
                      onClose={() => setIsPlanDialogOpen(false)}
                    />
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Interval</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stripe ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>${plan.price}</TableCell>
                        <TableCell>{plan.interval}</TableCell>
                        <TableCell>
                          <Badge variant={plan.isActive ? "default" : "secondary"}>
                            {plan.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{plan.stripePriceId}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPlan(plan);
                                setIsPlanDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{plan.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Template Dialog Component
function TemplateDialog({ template, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    category: template?.category || '',
    prompt: template?.prompt || '',
    isActive: template?.isActive ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogDescription>
          {template ? 'Update the prompt template details.' : 'Create a new prompt template.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt Content</Label>
          <Textarea
            id="prompt"
            value={formData.prompt}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
            rows={6}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update' : 'Create'} Template
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Plan Dialog Component
function PlanDialog({ plan, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || 0,
    interval: plan?.interval || 'month',
    features: plan?.features?.join('\n') || '',
    isActive: plan?.isActive ?? true,
    stripePriceId: plan?.stripePriceId || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const planData = {
      ...formData,
      features: formData.features.split('\n').filter(f => f.trim())
    };
    onSave(planData);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{plan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
        <DialogDescription>
          {plan ? 'Update the pricing plan details.' : 'Create a new pricing plan.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Billing Interval</Label>
            <Input
              id="interval"
              value={formData.interval}
              onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stripePriceId">Stripe Price ID</Label>
            <Input
              id="stripePriceId"
              value={formData.stripePriceId}
              onChange={(e) => setFormData(prev => ({ ...prev, stripePriceId: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="features">Features (one per line)</Label>
          <Textarea
            id="features"
            value={formData.features}
            onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
            rows={4}
            placeholder="5 stories/month&#10;Basic templates&#10;Email support"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="planActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          <Label htmlFor="planActive">Active</Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {plan ? 'Update' : 'Create'} Plan
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}