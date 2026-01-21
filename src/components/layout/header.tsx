import { TestTube2 } from 'lucide-react';

const Header = () => {
  return (
    <header className="p-4 border-b border-border bg-card/30">
      <div className="container flex items-center justify-between max-w-full mx-auto">
        <div className="flex items-center gap-2">
          <TestTube2 className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            Sci-Clean Studio
          </h1>
        </div>
        <p className="hidden text-sm md:block text-muted-foreground">
          Fast, Reproducible Data Cleaning for Researchers
        </p>
      </div>
    </header>
  );
};

export default Header;
