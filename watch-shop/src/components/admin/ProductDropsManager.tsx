import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  brand?: string;
};

type ProductDrop = {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  product_count?: number;
};

export const ProductDropsManager = () => {
  const [drops, setDrops] = useState<ProductDrop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDrop, setSelectedDrop] = useState<ProductDrop | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ProductDrop>>({
    name: '',
    description: '',
    start_date: new Date().toISOString().slice(0, 16),
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDrops();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedDrop) {
      fetchDropProducts(selectedDrop.id);
    }
  }, [selectedDrop]);

  const fetchDrops = async () => {
    try {
      const { data, error } = await supabase
        .from('product_drops')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setDrops(data || []);
      
      // Select the first drop by default
      if (data && data.length > 0) {
        setSelectedDrop(data[0]);
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product drops',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, brand')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    }
  };

  const fetchDropProducts = async (dropId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_drop_items')
        .select('product_id')
        .eq('drop_id', dropId);

      if (error) throw error;
      
      setSelectedProducts(data.map(item => item.product_id));
    } catch (error) {
      console.error('Error fetching drop products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products in drop',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      let dropId = selectedDrop?.id;
      
      // Create or update the drop
      if (dropId) {
        const { error } = await supabase
          .from('product_drops')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', dropId);
          
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('product_drops')
          .insert([{ ...formData }])
          .select()
          .single();
          
        if (error) throw error;
        dropId = data.id;
        setSelectedDrop(data);
      }
      
      // Update products in the drop
      if (dropId) {
        // First, remove all existing products
        const { error: deleteError } = await supabase
          .from('product_drop_items')
          .delete()
          .eq('drop_id', dropId);
          
        if (deleteError) throw deleteError;
        
        // Then add the selected products
        if (selectedProducts.length > 0) {
          const items = selectedProducts.map((productId, index) => ({
            drop_id: dropId,
            product_id: productId,
            position: index
          }));
          
          const { error: insertError } = await supabase
            .from('product_drop_items')
            .insert(items);
            
          if (insertError) throw insertError;
        }
      }
      
      toast({
        title: 'Success',
        description: 'Product drop saved successfully',
      });
      
      fetchDrops();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving product drop:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product drop',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      start_date: new Date().toISOString().slice(0, 16),
      is_active: true
    });
    setSelectedProducts([]);
    setSelectedDrop(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (drop: ProductDrop) => {
    setFormData({
      name: drop.name,
      description: drop.description || '',
      start_date: drop.start_date,
      end_date: drop.end_date || undefined,
      is_active: drop.is_active
    });
    setSelectedDrop(drop);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No end date';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Drops</h2>
        <Button onClick={handleCreateNew}>
          Create New Drop
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {drops.map(drop => (
          <div 
            key={drop.id} 
            className={`border rounded-lg p-4 ${selectedDrop?.id === drop.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedDrop(drop)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{drop.name}</h3>
                <p className="text-sm text-gray-500">{drop.product_count || 0} products</p>
                <p className="text-xs text-gray-400">
                  {formatDate(drop.start_date)} - {drop.end_date ? formatDate(drop.end_date) : 'No end date'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(drop);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDrop ? 'Edit Drop' : 'Create New Drop'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Drop Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Select Products</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {products.length === 0 ? (
                    <p className="text-sm text-gray-500">No products available</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map(product => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`product-${product.id}`}
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleCheckboxChange(product.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label 
                            htmlFor={`product-${product.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {product.name} - {product.brand} (${product.price})
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDropsManager;
