import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StyleFilterProps {
  style: string;
  isSelected: boolean;
  onToggle: (style: string) => void;
}

const getStyleImage = (style: string): string => {
  const styleImages: Record<string, string> = {
    "Geometric": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    "Dotwork": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
    "Watercolor": "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=400&h=300&fit=crop",
    "Neotraditional": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
    "Blackwork": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    "Minimalism": "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop",
    "Japanese": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=300&fit=crop",
    "Newschool": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
    "Traditional": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=300&fit=crop",
    "Realism": "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=400&h=300&fit=crop",
    "Tribal": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    "Illustrative": "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop",
    "Lettering": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
    "Sketch": "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop",
    "Floral": "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop",
    "Anime": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
    "Fineline": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop"
  };
  
  return styleImages[style] || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop";
};

const StyleFilter: React.FC<StyleFilterProps> = ({ style, isSelected, onToggle }) => {
  return (
    <div
      className={cn(
        "relative cursor-pointer transition-all duration-300 hover:scale-105 rounded-lg overflow-hidden",
        "h-20 w-28 group",
        isSelected ? "ring-2 ring-primary shadow-glow" : "hover:ring-1 hover:ring-border"
      )}
      onClick={() => onToggle(style)}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${getStyleImage(style)})` }}
      />
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-gradient-to-t from-black/70 via-black/40 to-black/20",
        isSelected ? "from-primary/70 via-primary/40 to-primary/20" : ""
      )}>
        <Badge
          variant={isSelected ? "default" : "secondary"}
          className={cn(
            "text-xs font-medium backdrop-blur-sm border-0",
            isSelected 
              ? "bg-primary/90 text-primary-foreground" 
              : "bg-background/80 text-foreground group-hover:bg-background/90"
          )}
        >
          {style}
        </Badge>
      </div>
    </div>
  );
};

export default StyleFilter;