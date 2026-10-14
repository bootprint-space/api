## Bootprint API

Official code for the Bootprint API.

Rate limiting is enabled at 60 requests per minute.
Requests that exceed the limit return HTTP 429 with a Retry-After header and a message like:
Rate limit exceeded. Please wait 1 minute before trying again.
Clients may optionally send an `x-client-id` header to get a separate limit bucket behind the same IP address.