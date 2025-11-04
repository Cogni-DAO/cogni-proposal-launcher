# UI Components Directory

## Purpose
Reusable design system components copied from cogni-site repository for consistent styling.

## Components

### `button.tsx`
**Source:** cogni-site Button component with class-variance-authority  
**Variants:** default, destructive, outline, secondary, ghost, link  
**Sizes:** default, sm, lg, icon  
**Styling:** Dark theme with CSS variable integration, Tailwind classes  

### `card.tsx` 
**Source:** cogni-site Card system components  
**Exports:** Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter  
**Styling:** Dark secondary background with proper borders and spacing  

### `alert.tsx`
**Source:** cogni-site Alert components with added success variant  
**Variants:** default, destructive, success  
**Exports:** Alert, AlertTitle, AlertDescription  
**Styling:** Consistent with dark theme color variables  

## Integration
- Uses `cn()` utility from `../lib/utils.ts` for class merging
- Consumes CSS variables from globals.css for theming
- Maintains visual consistency with cogni-site design system