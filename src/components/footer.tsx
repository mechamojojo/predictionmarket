import { Github } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="container max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 py-8 md:h-24 md:flex-row md:py-0 px-4">
        <div className="flex flex-col items-center gap-2 px-8 md:flex-row md:gap-3 md:px-0">
          <p className="text-center text-sm leading-relaxed text-muted-foreground md:text-left">
            Criado por{" "}
            <Link
              href="https://www.instagram.com/mechamojojo/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              mechamojojo
            </Link>
            {" · "}
            <Link
              href="https://github.com/mechamojojo"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              GitHub
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/mechamojojo"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
