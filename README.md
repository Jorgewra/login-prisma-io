# PROJECT LOGIN PRISMA.IO 
## Start project step by step

 1. Modify the file .example.env
 2. npm i 
 3. npm run dev or npm start

# Command Dev
  1. Prisma IO
    ```
    1. npx prisma generate --schema ./database/db.prisma
    2. npx prisma migrate dev --schema ./database/db.prisma
    3. Atualizar:npx prisma db pull --schema ./database/db.prisma
    ``` 
  2. docker network create -d bridge app-network
   
# Events Sockets
  1. profile - connection security send info user
  2. users.login - notify user login ou logout

# technology used
 - [Prisma](https://www.prisma.io/)
 - [NodeJs](https://nodejs.org/en/)
 - [Socket](https://socket.io/)

# dependence's
  - [NodeJS](https://nodejs.org/en/)
  
  
## Authors

* **Jorge Almeida** - *Initial work* - [jorgewra](https://github.com/Jorgewra)

See also the list of [contributors](https://https://github.com/Jorgewra/login-prisma-io/contributors) who participated in this project.
