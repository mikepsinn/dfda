import { CodeBlock } from "./CodeBlock"

export function RubyExamples() {
  return (
    <>
      <CodeBlock title="Fetch Clinical Trials">
        {`# Using Net::HTTP
require 'net/http'
require 'uri'
require 'json'

API_KEY = 'your_api_key'

def get_trials
  uri = URI('https://api.dfda.earth/v1/trials')
  uri.query = URI.encode_www_form({
    condition: 'diabetes',
    limit: 10
  })

  request = Net::HTTP::Get.new(uri)
  request['Authorization'] = "Bearer #{API_KEY}"
  request['Content-Type'] = 'application/json'

  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
    http.request(request)
  end

  if response.is_a?(Net::HTTPSuccess)
    data = JSON.parse(response.body)
    puts data
    return data
  else
    puts "Error: #{response.code} - #{response.message}"
  end
end

get_trials`}
      </CodeBlock>

      <CodeBlock title="Compare Treatment Effectiveness">
        {`# Using HTTParty
require 'httparty'

API_KEY = 'your_api_key'

def compare_effectiveness
  options = {
    headers: {
      'Authorization' => "Bearer #{API_KEY}",
      'Content-Type' => 'application/json'
    },
    query: {
      treatments: 'metformin,glp1-agonists,sglt2-inhibitors',
      condition: 'type-2-diabetes'
    }
  }

  begin
    response = HTTParty.get('https://api.dfda.earth/v1/effectiveness/compare', options)

    if response.success?
      puts response.parsed_response
      return response.parsed_response
    else
      puts "Error: #{response.code} - #{response.message}"
    end
  rescue HTTParty::Error => e
    puts "HTTParty Error: #{e.message}"
  rescue StandardError => e
    puts "Error: #{e.message}"
  end
end

compare_effectiveness`}
      </CodeBlock>
    </>
  )
}

