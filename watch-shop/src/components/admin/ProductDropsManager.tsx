import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Search, Filter, Eye, EyeOff, Plus, X, Trash2, Calendar, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  brand?: string;
  is_visible: boolean;
  category?: string;
  stock_quantity: number;
  created_at: string;
};

type ProductDrop = {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  is_featured: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
};

export const ProductDropsManager = () => {
  const [drops, setDrops] = useState<ProductDrop[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedDrop, setSelectedDrop] = useState<ProductDrop | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  
  const [formData, setFormData] = useState<Partial<ProductDrop>>({
    name: '',
    description: '',
    start_date: new Date().toISOString().slice(0, 16),
    is_active: true,
    is_featured: false
  });
  
  const { toast } = useToast();
  
  // Get unique categories and brands for filters
  const categories = useMemo(() => {
    const cats = new Set(allProducts.map(p => p.category).filter(Boolean) as string[]);
    return ['all', ...Array.from(cats).sort()];
  }, [allProducts]);
  
  const brands = useMemo(() => {
    const brnds = new Set(allProducts.map(p => p.brand).filter(Boolean) as string[]);
    return ['all', ...Array.from(brnds).sort()];
  }, [allProducts]);

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    }
  };
  
  // Filter products based on search and filters
  useEffect(() => {
    let result = [...allProducts];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.brand && p.brand.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Apply brand filter
    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand === selectedBrand);
    }
    
    setFilteredProducts(result);
  }, [allProducts, searchTerm, selectedCategory, selectedBrand]);

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
      const dropData = {
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      // Create or update the drop
      if (dropId) {
        const { error } = await supabase
          .from('product_drops')
          .update(dropData)
          .eq('id', dropId);
          
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('product_drops')
          .insert([dropData])
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
        description: `Product drop "${formData.name}" has been ${selectedDrop ? 'updated' : 'created'} successfully`,
      });
      
      fetchDrops();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving product drop:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product drop',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteDrop = async () => {
    if (!selectedDrop) return;
    
    try {
      setIsSaving(true);
      
      // First delete all related product_drop_items
      const { error: deleteItemsError } = await supabase
        .from('product_drop_items')
        .delete()
        .eq('drop_id', selectedDrop.id);
        
      if (deleteItemsError) throw deleteItemsError;
      
      // Then delete the drop
      const { error: deleteDropError } = await supabase
        .from('product_drops')
        .delete()
        .eq('id', selectedDrop.id);
        
      if (deleteDropError) throw deleteDropError;
      
      toast({
        title: 'Success',
        description: `Product drop "${selectedDrop.name}" has been deleted`,
      });
      
      fetchDrops();
      setIsDeleteDialogOpen(false);
      setSelectedDrop(null);
    } catch (error) {
      console.error('Error deleting product drop:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product drop',
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
      end_date: undefined,
      is_active: true,
      is_featured: false
    });
    setSelectedProducts([]);
    setSelectedDrop(null);
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setIsDialogOpen(true);
  };

  const handleEdit = (drop: ProductDrop) => {
    setFormData({
      name: drop.name,
      description: drop.description || '',
      start_date: drop.start_date,
      end_date: drop.end_date || undefined,
      is_active: drop.is_active,
      is_featured: drop.is_featured || false
    });
    setSelectedDrop(drop);
    setIsDialogOpen(true);
  };
  
  const toggleProductVisibility = async (productId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_visible: isVisible })
        .eq('id', productId);
        
      if (error) throw error;
      
      // Update local state
      setAllProducts(prev => 
        prev.map(p => 
          p.id === productId ? { ...p, is_visible: isVisible } : p
        )
      );
      
      toast({
        title: 'Success',
        description: `Product visibility ${isVisible ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating product visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product visibility',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No end date';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  const getStatusBadge = (drop: ProductDrop) => {
    const now = new Date();
    const startDate = new Date(drop.start_date);
    const endDate = drop.end_date ? new Date(drop.end_date) : null;
    
    if (!drop.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    if (now < startDate) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    
    if (endDate && now > endDate) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    
    return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Product Drops</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product drops and collections
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create New Drop
        </Button>
      </div>

      <Tabs defaultValue="drops" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drops">Drops</TabsTrigger>
          <TabsTrigger value="products">All Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drops" className="space-y-4">
          {drops.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No product drops yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first product drop.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Drop
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {drops.map(drop => (
                <div 
                  key={drop.id} 
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                    selectedDrop?.id === drop.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{drop.name}</h3>
                        {drop.is_featured && (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            Featured
                          </Badge>
                        )}
                        {getStatusBadge(drop)}
                      </div>
                      {drop.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {drop.description}
                        </p>
                      )}
                      <div className="mt-2 text-sm space-y-1">
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="mr-2 h-3.5 w-3.5" />
                          <span>Starts: {formatDate(drop.start_date)}</span>
                        </div>
                        {drop.end_date && (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="mr-2 h-3.5 w-3.5" />
                            <span>Ends: {formatDate(drop.end_date)}</span>
                          </div>
                        )}
                        <div className="flex items-center text-muted-foreground">
                          <Tag className="mr-2 h-3.5 w-3.5" />
                          <span>{drop.product_count || 0} products</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(drop);
                        }}
                      >
                        <span className="sr-only">Edit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDrop(drop);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <span className="sr-only">Delete</span>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                <Select 
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={selectedBrand}
                  onValueChange={setSelectedBrand}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand === 'all' ? 'All Brands' : brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b">
                <div className="col-span-5 font-medium">Product</div>
                <div className="col-span-2 font-medium">Brand</div>
                <div className="col-span-2 font-medium">Category</div>
                <div className="col-span-2 font-medium text-right">Price</div>
                <div className="col-span-1 font-medium text-right">Status</div>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No products found. Try adjusting your search or filters.
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50">
                      <div className="col-span-5 flex items-center gap-3">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            ID: {product.id.split('-')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {product.brand || '-'}
                      </div>
                      <div className="col-span-2">
                        {product.category ? (
                          <Badge variant="outline">{product.category}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        ${product.price.toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toggleProductVisibility(product.id, !product.is_visible)}
                        >
                          {product.is_visible ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {product.is_visible ? 'Hide' : 'Show'} product
                          </span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDrop ? `Edit "${selectedDrop.name}"` : 'Create New Drop'}
            </DialogTitle>
            <DialogDescription>
              {selectedDrop 
                ? 'Update the details of this product drop.'
                : 'Create a new product drop to showcase a collection of products.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="products">Products ({selectedProducts.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Drop Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Summer Collection 2023"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Add a description for this drop..."
                      />
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, is_active: checked }))
                          }
                        />
                        <Label htmlFor="is_active" className="flex flex-col space-y-1">
                          <span>Active</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {formData.is_active ? 'This drop is currently visible to customers' : 'This drop is hidden from customers'}
                          </span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_featured"
                          checked={formData.is_featured || false}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, is_featured: checked }))
                          }
                        />
                        <Label htmlFor="is_featured" className="flex flex-col space-y-1">
                          <span>Featured</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {formData.is_featured ? 'This drop will be highlighted as featured' : 'This is a regular drop'}
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <div className="relative">
                        <Input
                          id="start_date"
                          name="start_date"
                          type="datetime-local"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When this drop should become visible to customers
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <div className="relative">
                        <Input
                          id="end_date"
                          name="end_date"
                          type="datetime-local"
                          value={formData.end_date || ''}
                          onChange={handleInputChange}
                          min={formData.start_date}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When this drop should be automatically hidden (leave empty for no end date)
                      </p>
                    </div>
                    
                    {selectedDrop && (
                      <div className="pt-4 mt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          <p>Created: {format(new Date(selectedDrop.created_at), 'MMM d, yyyy')}</p>
                          <p>Last updated: {format(new Date(selectedDrop.updated_at || selectedDrop.created_at), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="products" className="space-y-4">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select 
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={selectedBrand}
                      onValueChange={setSelectedBrand}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map(brand => (
                          <SelectItem key={brand} value={brand}>
                            {brand === 'all' ? 'All Brands' : brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {(searchTerm || selectedCategory !== 'all' || selectedBrand !== 'all') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                          setSelectedBrand('all');
                        }}
                        className="ml-auto"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b">
                      <div className="col-span-6 font-medium">Product</div>
                      <div className="col-span-2 font-medium">Brand</div>
                      <div className="col-span-2 font-medium text-right">Price</div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm text-muted-foreground">
                          {selectedProducts.length} selected
                        </span>
                      </div>
                    </div>
                    
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No products found. Try adjusting your search or filters.
                      </div>
                    ) : (
                      <div className="divide-y max-h-[400px] overflow-y-auto">
                        {filteredProducts.map(product => (
                          <div key={product.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50">
                            <div className="col-span-6 flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`select-${product.id}`}
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => handleCheckboxChange(product.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                  <Tag className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  ID: {product.id.split('-')[0]}
                                </p>
                              </div>
                            </div>
                            <div className="col-span-2 text-sm text-muted-foreground">
                              {product.brand || '-'}
                            </div>
                            <div className="col-span-2 text-right font-medium">
                              ${product.price.toFixed(2)}
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <Badge variant={product.is_visible ? 'default' : 'outline'}>
                                {product.is_visible ? 'Visible' : 'Hidden'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>{selectedDrop ? 'Save Changes' : 'Create Drop'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product Drop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the drop "{selectedDrop?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDrop}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Delete Drop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDropsManager;
