class ExpressError extends Error{
    constructor(statusCode,Message){
        super();
        this.statusCode=statusCode;
        this.message=Message;


    }
}

module.exports= ExpressError;