import { create } from "zustand";

type SearchModalState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
};

export const useSearchModalStore = create<SearchModalState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));
