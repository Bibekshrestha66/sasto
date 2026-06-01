import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { data: cart, refetch, isLoading } = trpc.cart.get.useQuery();
  
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  useEffect(() => {
    if (removeItemMutation.isSuccess) { toast.success("Item removed from cart"); refetch(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeItemMutation.isSuccess]);

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  useEffect(() => {
    if (updateQuantityMutation.isSuccess) { refetch(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateQuantityMutation.isSuccess]);
  useEffect(() => {
    if (updateQuantityMutation.isError) { toast.error((updateQuantityMutation.error as any)?.message || "Failed to update quantity"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateQuantityMutation.isError]);

  const clearCartMutation = trpc.cart.clear.useMutation();
  useEffect(() => {
    if (clearCartMutation.isSuccess) { toast.success("Cart cleared"); refetch(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCartMutation.isSuccess]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading cart...</div>;
  }

  const items = cart?.items || [];
  
  // Group by vendor
  const vendorGroups: Record<number, { vendorName: string, items: any[] }> = {};
  items.forEach(item => {
    const vendor = item.listing.user;
    if (!vendorGroups[vendor.id]) {
      vendorGroups[vendor.id] = {
        vendorName: vendor.name || "Unknown Vendor",
        items: []
      };
    }
    vendorGroups[vendor.id].items.push(item);
  });

  const subtotal = items.reduce((acc, item) => acc + ((item.listing.price ?? 0) * item.quantity), 0);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold text-gray-900">Your Cart</h1>
      </div>

      {items.length === 0 ? (
        <Card className="text-center p-12 border-dashed border-2">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Button onClick={() => setLocation("/")} className="rounded-xl">
            Continue Shopping
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {Object.values(vendorGroups).map((group, idx) => (
              <Card key={idx} className="overflow-hidden shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50 py-3 border-b">
                  <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    Seller: <span className="text-primary">{group.vendorName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {group.items.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row p-4 border-b last:border-b-0 gap-4 items-center">
                      {item.listing.images && item.listing.images.length > 0 ? (
                        <img 
                          src={item.listing.images[0]} 
                          alt={item.listing.title} 
                          className="w-24 h-24 object-cover rounded-xl border"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-xl border flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <Link href={`/listing/${item.listing.id}`}>
                          <h3 className="font-bold text-lg hover:text-primary cursor-pointer line-clamp-1">{item.listing.title}</h3>
                        </Link>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-500">Quantity:</span>
                          <div className="flex items-center border rounded-lg bg-gray-50">
                            <button 
                              className="px-3 py-1 hover:bg-gray-200 rounded-l-lg transition-colors text-gray-600 disabled:opacity-50"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 });
                                }
                              }}
                              disabled={updateQuantityMutation.isPending || item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="px-4 py-1 text-sm font-medium">{item.quantity}</span>
                            <button 
                              className="px-3 py-1 hover:bg-gray-200 rounded-r-lg transition-colors text-gray-600 disabled:opacity-50"
                              onClick={() => {
                                if (item.quantity < (item.listing.stock || 1)) {
                                  updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 });
                                } else {
                                  toast.error(`Only ${item.listing.stock} in stock`);
                                }
                              }}
                              disabled={updateQuantityMutation.isPending || item.quantity >= (item.listing.stock || 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <p className="font-bold text-primary mt-2">NPR {(item.listing.price * item.quantity).toLocaleString()}</p>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => removeItemMutation.mutate({ itemId: item.id })}
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="text-gray-500 border-gray-300 rounded-xl"
                onClick={() => {
                  if(confirm("Are you sure you want to clear your cart?")) {
                    clearCartMutation.mutate();
                  }
                }}
                disabled={clearCartMutation.isPending}
              >
                Clear Cart
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg border-primary/20 sticky top-24">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-lg font-extrabold text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold">NPR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Estimated Tax</span>
                  <span className="font-semibold">Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Total</span>
                    <span className="font-extrabold text-2xl text-primary">NPR {subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6 h-12 rounded-xl text-lg font-bold shadow-md hover:shadow-lg transition-all"
                  onClick={() => setLocation("/checkout")}
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
