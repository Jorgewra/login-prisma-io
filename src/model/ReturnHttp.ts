class ReturnHttp {
    public message: string = ""
    public status: number = 200
    public data: any =null
    constructor(message: string,status: number,data:any ){
        this.message = message
        this.status = status
        this.data = data
    }
}

export default ReturnHttp;