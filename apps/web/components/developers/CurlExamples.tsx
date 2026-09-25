import { CodeBlock } from "./CodeBlock"

export function CurlExamples() {
  return (
    <>
      <CodeBlock title="Fetch Clinical Trials">
        {`curl -X GET "https://api.dfda.earth/v1/trials?condition=diabetes&limit=10" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json"`}
      </CodeBlock>

      <CodeBlock title="Get Outcome Label">
        {`curl -X GET "https://api.dfda.earth/v1/outcomes/atorvastatin-20mg" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json"`}
      </CodeBlock>

      <CodeBlock title="Compare Treatment Effectiveness">
        {`curl -X GET "https://api.dfda.earth/v1/effectiveness/compare?treatments=metformin,glp1-agonists,sglt2-inhibitors&condition=type-2-diabetes" \\
  -H "Authorization: Bearer your_api_key" \\  -H "Content-Type: application/json"`}
      </CodeBlock>
    </>
  )
}

