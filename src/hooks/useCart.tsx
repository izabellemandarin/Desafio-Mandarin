import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  })

  const prevCart = prevCartRef.current ?? cart;

  useEffect(() => {
    if(prevCart !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, prevCart]);


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
      const amountDesired = currentAmount + 1;

      if (amountDesired > stockData) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (currentProduct) {
        currentProduct.amount = amountDesired;
      }else{
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        addCart.push(newProduct);
      }
      setCart(addCart);
      

    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeItem = [...cart];

      const updatedCart = removeItem.findIndex(product => product.id === productId);
      
      //If it finded the product, remove it
      if(updatedCart >= 0){
        removeItem.splice(updatedCart, 1);
        setCart(removeItem);
        
      }else{
        throw Error()
      }

    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
  
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updateCart = [...cart];
      const productExists = updateCart.find(product => product.id === productId);

      if (productExists){
        productExists.amount = amount;
        setCart(updateCart);
      }else{
        throw Error()
      }

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
