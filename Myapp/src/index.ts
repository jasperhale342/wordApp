import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constant";
import microConfig from "./mikro-orm.config";
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import connectRedis from 'connect-redis';
import { MyContext } from "./types";






const main  = async () =>{
    
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  const session = require('express-session');
  const app = express();

  const RedisStore = connectRedis(session); //for storing cookies
  const redisClient = redis.createClient();
  app.set('trust proxy', 1);
  app.use(
    session({
      name: "qid",
      saveUninitialized: false,
      secret: 'kljhsafdlkashdkfdfgh',
      resave: false,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true // so you not accessing redis constantly
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        sameSite: 'lax',
        secure: false, //cookie only works in https
      },
    }));

    const apolloServer = new ApolloServer({
        schema: await buildSchema({ 
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}): MyContext => ({em: orm.em, req, res}) //special object that is accessable by all resolvers, can also access response and request
    });

    apolloServer.applyMiddleware({app, cors: false});

    app.get("/", (_, res)=>{
        res.header('Content-Type', 'application/json')
        res.send("hello");
    });


    app.listen(4000, () =>{
        console.log("server started on localhost:4000")
    });

  
}
main().catch((err) => { 
    console.error(err)
});


