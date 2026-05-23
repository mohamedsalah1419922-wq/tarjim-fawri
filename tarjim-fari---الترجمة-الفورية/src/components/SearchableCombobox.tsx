import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  flag?: string;
  icon?: React.ReactNode;
}

interface SearchableComboboxProps {
  id: string;
  options: ComboboxOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  customTrigger?: (selected: ComboboxOption | undefined, isOpen: boolean) => React.ReactNode;
  alignLeft?: boolean;
}

const dropdownVariants = {
  hidden: { 
    opacity: 0, 
    y: -8, 
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 24,
      staggerChildren: 0.03,
      delayChildren: 0.01
    }
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeInOut"
    }
  }
};

const dropdownItemVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 20 }
  }
};

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  id,
  options,
  selectedValue,
  onChange,
  placeholder = "اختر خياراً...",
  searchPlaceholder = "ابحث هنا...",
  emptyText = "لم يتم العثور على نتائج متطابقة",
  customTrigger,
  alignLeft = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  // Filter options based on query (Arabic & English support)
  const filteredOptions = options.filter((opt) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const labelMatch = opt.label.toLowerCase().includes(query);
    const subLabelMatch = opt.subLabel?.toLowerCase().includes(query) || false;
    const valueMatch = opt.value.toLowerCase().includes(query);
    return labelMatch || subLabelMatch || valueMatch;
  });

  // Focus search input when combobox opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Click outside to close helper
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full relative text-right" ref={containerRef} id={`combobox-container-${id}`}>
      {/* Trigger element */}
      {customTrigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer select-none">
          {customTrigger(selectedOption, isOpen)}
        </div>
      ) : (
        <button
          id={`combobox-trigger-${id}`}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white dark:bg-[#070F1E] py-3.5 px-4 rounded-xl border border-sky-150 dark:border-sky-900/60 text-sky-950 dark:text-sky-200 font-bold focus:ring-2 focus:ring-sky-500/20 focus:outline-none cursor-pointer transition-all hover:border-sky-400 text-right select-none"
        >
          <ChevronDown className={`w-4 h-4 text-sky-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          <div className="flex items-center gap-2 select-none">
            {selectedOption?.icon && <span className="text-sky-500">{selectedOption.icon}</span>}
            {selectedOption?.flag && <span className="text-base leading-none shrink-0">{selectedOption.flag}</span>}
            <span className="text-xs sm:text-sm font-black truncate max-w-[180px]">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </button>
      )}

      {/* Dropdown overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`combobox-menu-${id}`}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute z-100 mt-2 p-2 rounded-2xl bg-white dark:bg-[#070F1E] border border-sky-150 dark:border-sky-950 shadow-2xl space-y-1 block text-right origin-top w-full md:min-w-[280px] max-h-[380px] flex flex-col ${
              alignLeft ? "left-0" : "right-0"
            }`}
          >
            {/* Search Input Box */}
            <div className="relative p-1 shrink-0">
              <input
                id={`combobox-search-${id}`}
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                dir="rtl"
                className="w-full bg-sky-50/50 dark:bg-sky-950/30 text-right pr-9 pl-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-sky-100 dark:border-sky-900/40 focus:border-sky-400 focus:outline-none text-sky-950 dark:text-sky-200"
              />
              <Search className="w-4 h-4 text-sky-400 dark:text-sky-500 absolute top-1/2 right-4 -translate-y-1/2 select-none pointer-events-none" />
            </div>

            {/* List Option Entries */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden select-none space-y-0.5 custom-scrollbar pr-1 pt-1">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-sky-450 dark:text-sky-600 font-bold select-none">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === selectedValue;
                  return (
                    <motion.button
                      key={opt.value}
                      id={`combobox-opt-${id}-${opt.value}`}
                      variants={dropdownItemVariants}
                      whileHover={{ scale: 1.015, x: -1.5 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-start justify-between gap-3 p-2.5 rounded-xl text-right transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-500 text-white shadow-3xs"
                          : "hover:bg-sky-50 dark:hover:bg-sky-950/50 text-sky-950 dark:text-sky-200"
                      }`}
                    >
                      {/* Checkmark indicator aligned to left */}
                      <span className="self-center shrink-0">
                        {isSelected && <Check className="w-4 h-4 stroke-[3px]" />}
                      </span>

                      {/* Content aligned to right */}
                      <div className="flex items-start gap-2.5 text-right flex-1 min-w-0">
                        {opt.icon && (
                          <span className={`p-1.5 rounded-md shrink-0 self-start ${
                            isSelected ? "bg-white/20 text-white" : "bg-sky-50 dark:bg-sky-950 text-sky-500"
                          }`}>
                            {opt.icon}
                          </span>
                        )}
                        {opt.flag && (
                          <span className="text-base leading-none mt-0.5 shrink-0 self-start">
                            {opt.flag}
                          </span>
                        )}
                        <div className="flex flex-col items-start leading-snug text-right min-w-0 flex-1">
                          <span className="text-xs font-black truncate max-w-full">
                            {opt.label}
                          </span>
                          {opt.subLabel && (
                            <span className={`text-[10px] mt-0.5 text-right font-semibold truncate max-w-full block ${
                              isSelected ? "text-sky-100" : "text-gray-400 dark:text-sky-305/50"
                            }`}>
                              {opt.subLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
