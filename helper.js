const base64url = (str) => {
  return btoa(str).replace(/\+/, '-').replace(/\//, '-').replace(/\=/, '');
};

export { base64url };
