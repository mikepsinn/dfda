import Link from 'next/link';

interface ConditionCardProps {
    href: string;
    emoji: string;
    title: string;
    description: string;
    isExternal?: boolean;
}

export function ConditionCard({ href, emoji, title, description, isExternal = false }: ConditionCardProps) {
    const cardClassName = "p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow";
    
    const content = (
        <>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{emoji}</span>
                <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <p className="text-gray-600">{description}</p>
        </>
    );

    if (isExternal) {
        return (
            <a 
                href={href}
                className={cardClassName}
                target="_blank"
                rel="noopener noreferrer"
            >
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={cardClassName}>
            {content}
        </Link>
    );
} 