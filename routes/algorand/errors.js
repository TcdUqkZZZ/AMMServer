exports.dbError = class dbError extends Error {
    constructor(message){
      super(message);
      this.name = "dbError"
    }
  }
  
  exports.algorandError = class algorandError extends Error {
    constructor(message){
    super(message);
    this.name = "algorandError"}
  }

exports.algodError = class algorandError extends Error {
  constructor(message){
    super(message);
    this.name = "algodError"
  }
}
  
  
  