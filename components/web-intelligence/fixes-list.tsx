import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FixesListProps = {
  fixes: string[];
};

export function FixesList({ fixes }: FixesListProps) {
  return (
    <Card className="bg-brandNavy border-brandBlue/40">
      <CardHeader>
        <CardTitle className="text-base text-brandBlueLight">Recommended fixes</CardTitle>
      </CardHeader>
      <CardContent>
        {fixes.length === 0 ? (
          <p className="text-sm text-brandBlueLight/70">No fixes available yet. Run another scan after homepage updates.</p>
        ) : (
          <ul className="space-y-2 text-sm text-brandBlueLight/80">
            {fixes.map((fix, index) => (
              <li key={`${fix}-${index}`} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brandBlueLight" />
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
