import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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

  const addProduct = async (productId: number) => {
    try {
      const { data: response } = await api.get(`/stock/${productId}`);

      const product = cart.filter(item => item.id === productId)[0];

      if (response.amount === 0 || response.amount <= product?.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const productExistsInCart = cart.find(product => product.id === productId);
  
        if (productExistsInCart) {
          const newCart = cart.map(product => ({
            ...product,
            amount: product.id === productId ? product.amount + 1 : product.amount,
          }));
  
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          const { data: product } = await api.get(`/products/${productId}`);
  
          const newCart = [...cart, { ...product, amount: 1 }]
  
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistsInCart = cart.find(product => product.id === productId);

      if (productExistsInCart) {
        const newCart = cart.filter(product => product.id !== productId);
  
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error;
      }
    } catch {
      toast.error('Erro na remoção do produto');
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

      const { data: stockRequest } = await api.get(`/stock/${productId}`);
      
      if (stockRequest.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const newCart = cart.map(product => ({
          ...product,
          amount: product.id === productId ? amount : product.amount,
        }))

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
