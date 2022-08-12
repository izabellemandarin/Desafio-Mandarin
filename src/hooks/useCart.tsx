import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const addCart = [...cart];

      // Find the Id of the product in the cart
      const currentProduct = addCart.find(
        (product) => product.id === productId
      );

      // Deal with Stock
      const stock = await api.get(`/stock/${productId}`);
      const stockData = stock.data.amount;

      // Deal with amount of the product and in the stock
      const currentAmount = currentProduct ? currentProduct.amount : 0;
      const amount = currentAmount + 1;

      if (currentAmount < stockData) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (currentProduct) {
        currentProduct.amount = amount;
      }

      setCart(addCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(currentProduct));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeItem = [...cart];

      const updatedCart = removeItem.filter(
        (product) => product.id !== productId
      );

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedProduct = [...cart];

      const currentProduct = updatedProduct.find(
        (product) => product.id === productId
      );

      const product = await api.get(`/product/${productId}`);
      const productData = product.data.amount;

      // Deal with amount of the product and in the stock
      const currentAmount = currentProduct ? currentProduct.amount : 0;
      const amount = currentAmount + 1;

      if (productData <= 0) {
        return;
      }

      if (currentAmount < productData) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      setCart(updatedProduct);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(currentProduct));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
