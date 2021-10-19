const axios = require('axios')

const getCert = async () => {
  const { data } = await axios.default.get(
    'https://dev-0c5ijnvn.us.auth0.com/pem'
  )
  console.log(`${data}`)
  console.log(typeof `${data}`)
}

getCert()
