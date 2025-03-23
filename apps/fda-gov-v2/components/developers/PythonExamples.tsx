import { CodeBlock } from "./CodeBlock"

export function PythonExamples() {
  return (
    <>
      <CodeBlock title="Fetch Clinical Trials">
        {`# Using requests
import requests

API_KEY = 'your_api_key'

def get_trials():
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }

    params = {
        'condition': 'diabetes',
        'limit': 10
    }

    try:
        response = requests.get('https://api.fdav2.gov/v1/trials', headers=headers, params=params)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses

        data = response.json()
        print(data)
        return data
    except requests.exceptions.RequestException as e:
        print(f'Error fetching trials: {e}')

get_trials()`}
      </CodeBlock>

      <CodeBlock title="Get Outcome Label">
        {`# Using requests
import requests

API_KEY = 'your_api_key'

def get_outcome_label(outcome_id):
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(f'https://api.fdav2.gov/v1/outcomes/{outcome_id}', headers=headers)
        response.raise_for_status()

        data = response.json()
        print(data)
        return data
    except requests.exceptions.RequestException as e:
        print(f'Error fetching outcome label: {e}')

get_outcome_label('atorvastatin-20mg')`}
      </CodeBlock>
    </>
  )
}

