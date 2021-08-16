function importAll(r) {
    r.keys().forEach(r);
}
  
export default importAll(require.context('../img', true, /\.jpg$/));