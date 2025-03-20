export function isSuccessRequest(requestStatus: number | undefined) {
  return requestStatus !== undefined && [200, 201, 202, 204].includes(requestStatus)
}

export function isErroRequest(requestStatus: number | undefined) {
  return requestStatus !== undefined && [400, 401, 403, 404].includes(requestStatus)
}