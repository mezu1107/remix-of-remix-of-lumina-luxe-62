import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/products";
import { trackEvent } from "@/lib/tracking";
import { captureLead } from "@/lib/leads";

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (product: Product, opts?: { color?: string; size?: string; quantity?: number }) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (product, opts) => {
        const quantity = opts?.quantity ?? 1;
        void trackEvent("add_to_cart", {
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          value: (product.salePrice ?? product.price) * quantity,
          metadata: { quantity, color: opts?.color ?? null, size: opts?.size ?? null },
        });
        set((state) => {
          const key = `${product.id}-${opts?.color ?? ""}-${opts?.size ?? ""}`;
          const existing = state.items.find((i) => i.id === key);
          if (existing) {
            const next = {
              items: state.items.map((i) =>
                i.id === key ? { ...i, quantity: i.quantity + quantity } : i,
              ),
              isOpen: true,
            };
            void captureLead({
              stage: "add_to_cart",
              items: next.items.map((i) => ({
                name: i.product.name,
                slug: i.product.slug,
                quantity: i.quantity,
                price: i.product.salePrice ?? i.product.price,
              })),
            });
            return next;
          }
          const next = {
            items: [
              ...state.items,
              { id: key, product, quantity, color: opts?.color, size: opts?.size },
            ],
            isOpen: true,
          };
          void captureLead({
            stage: "add_to_cart",
            items: next.items.map((i) => ({
              name: i.product.name,
              slug: i.product.slug,
              quantity: i.quantity,
              price: i.product.salePrice ?? i.product.price,
            })),
          });
          return next;
        });
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    { name: "timera-cart" },
  ),
);

type WishlistState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: "timera-wishlist" },
  ),
);
