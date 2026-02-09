'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Star, Edit, Archive, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
    projectId: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onStar?: () => void;
    onArchive?: () => void;
    isStarred?: boolean;
}

export function QuickActions({
    projectId,
    onEdit,
    onDelete,
    onStar,
    onArchive,
    isStarred = false
}: QuickActionsProps) {
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const actions = [
        {
            label: isStarred ? 'Unstar' : 'Star',
            icon: Star,
            onClick: () => {
                onStar?.();
                setOpen(false);
            },
            className: isStarred ? 'text-yellow-600' : '',
        },
        {
            label: 'Edit',
            icon: Edit,
            onClick: () => {
                onEdit?.();
                setOpen(false);
            },
            className: '',
        },
        {
            label: 'Archive',
            icon: Archive,
            onClick: () => {
                onArchive?.();
                setOpen(false);
            },
            className: '',
        },
        {
            label: 'Delete',
            icon: Trash2,
            onClick: () => {
                onDelete?.();
                setOpen(false);
            },
            className: 'text-red-600 hover:bg-red-50',
        },
    ];

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus first item when menu opens
            setTimeout(() => itemRefs.current[0]?.focus(), 0);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            // Open menu with Enter or Space
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                buttonRef.current?.focus();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => {
                    const nextIndex = (prev + 1) % actions.length;
                    itemRefs.current[nextIndex]?.focus();
                    return nextIndex;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => {
                    const nextIndex = prev === 0 ? actions.length - 1 : prev - 1;
                    itemRefs.current[nextIndex]?.focus();
                    return nextIndex;
                });
                break;
            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                itemRefs.current[0]?.focus();
                break;
            case 'End':
                e.preventDefault();
                const lastIndex = actions.length - 1;
                setFocusedIndex(lastIndex);
                itemRefs.current[lastIndex]?.focus();
                break;
        }
    };

    return (
        <div className="relative" onKeyDown={handleKeyDown}>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(!open);
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                aria-label="Project actions menu"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <MoreVertical className="w-4 h-4 text-gray-600" aria-hidden="true" />
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Menu */}
                    <div
                        ref={menuRef}
                        className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="project-actions-menu"
                    >
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    ref={(el) => { itemRefs.current[index] = el; }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-left',
                                        action.className
                                    )}
                                    role="menuitem"
                                    tabIndex={-1}
                                >
                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
