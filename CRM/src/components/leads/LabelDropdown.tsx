"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check, ChevronDown } from "lucide-react";

export const LABEL_OPTIONS = [
  "50% Probability",
  "90% Probability",
  "Call this week",
  "Corporate",
  "Inactive",
  "Potential",
  "Referral",
  "Satisfied"
];

interface LabelDropdownProps {
  selectedLabels: string;
  onChange: (labels: string) => void;
  variant?: "compact" | "form";
  placeholder?: string;
  options?: string[];
}

export default function LabelDropdown({
  selectedLabels,
  onChange,
  variant = "form",
  placeholder = "Select labels",
  options = LABEL_OPTIONS
}: LabelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current label (assume single label)
  const selected = selectedLabels ? selectedLabels.trim() : "";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLabel = (label: string) => {
    if (selected === label) {
      onChange("");
    } else {
      onChange(label);
    }
    setIsOpen(false);
  };

  // Determine badge styling dynamically
  const getBadgeClass = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("call this week")) {
      return "bg-purple-50 text-purple-700 border-purple-100";
    }
    if (lower.includes("90% probability")) {
      return "bg-green-50 text-green-700 border-green-100";
    }
    if (lower.includes("50% probability")) {
      return "bg-yellow-50 text-yellow-750 border-yellow-100";
    }
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {variant === "compact" ? (
        // Table/Compact cell trigger
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-wrap gap-1 max-w-[150px] cursor-pointer group"
        >
          {selected ? (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors hover:opacity-80 ${getBadgeClass(
                selected
              )}`}
            >
              {selected}
            </span>
          ) : (
            <span className="text-gray-400 text-xs border border-dashed border-gray-300 rounded-full px-2 py-0.5 hover:border-gray-400 hover:text-gray-600 transition-colors">
              + Label
            </span>
          )}
        </div>
      ) : (
        // Form field style trigger
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[38px] w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all cursor-pointer flex items-center justify-between gap-2"
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selected ? (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeClass(
                  selected
                )}`}
              >
                {selected}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                  className="hover:bg-black/5 rounded-full p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ) : (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = selected === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLabel(opt);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between text-gray-750 font-medium transition-colors"
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <Check size={14} className="text-blue-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
