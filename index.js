const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

//DB
const User = require("./models/users.js");
const Post = require("./models/posts.js");
const Counter = require("./models/counters.js");

//dotenv
dotenv.config();

//익스프레스
const app = express();

//app.use
app.use(bodyParser.json());
app.use(express.json());
app.use(
  cors({
    // origin: "https://kasinoki.site",
  })
);

// Checking Server
app.listen('3000', () => {
    console.log('Listening on Server at 3000');
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(console.log("DB connected at MongoDB"))
    .catch((err) => console.log(err));
});

// GET //--------------------

// GET SERVER HOME
app.get('/', async (req, res) => {
    res.send({ Message: '환영합니다' });
})

// GET BOARD
app.get('/getboard', async (req, res) => {
  try {
    
    const allposts = await Post.find()
    .sort({ postNumber : -1 })
    .populate({
      path: "writer",
      select: "username",
    });
    // console.log(allposts);
    res.status(200).json(allposts);

  } catch (error) {
    console.log(error);
    res.status(500).send("서버 에러 발생");  }
})

// GET POST
app.get('/board/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id);
    const post = await Post.findById(id).populate({
      path: "writer",
      select: "username",
    });

    if (!post) {
      return res.status(400).json({ Message : '포스트가 없습니다' })
    }

    res.status(200).json(post);
    // console.log(post);
  } catch (error) {
    console.log(error);  }
})

// GET WRITED POST
app.get('/write/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id);
    const post = await Post.findById(id).populate({
      path: "writer",
      select: "username",
    });

    if (!post) {
      return res.status(400).json({ Message : '포스트가 없습니다' })
    }

    res.status(200).json(post);
    // console.log(post);
  } catch (error) {
    console.log(error);  }
})

// POST //--------------------

// POST LOGIN
app.post('/login', async (req, res) => {
    const { loginId, loginPw } = req.body

    if(!loginId || !loginPw) {
        return res.status(422).json({ Message : "빈칸입니다" });
    }

    const user = await User.findOne({ loginId }).exec();

    if(!user){
        return res.status(401).json({ Message: '로그인 실패' })
    }

    const match = await bcrypt.compare(loginPw, user.loginPw);

    if(!match) {
        return res.status(401).json({ Message : '로그인 실패' })
    }

    const token = jwt.sign(
        { userId : user._id, username: user.username },
        "JWT_SECRET_KEY",
        { expiresIn : "7h" }
    );

    return res.status(200).json({ success: true, user: { username: user.username }, token });

});

// POST CHECK USERNAME
app.post('/checkusername', async (req, res) => {
  const { username } = req.body;
  if(!username) {
    return res.status(404).json({ Message: "닉네임이 없습니다" });
  }
  const usernameExists = await User.exists({ username }).exec();
  if (usernameExists) {
    return res.status(409).json({ success : false })
  } else { 
    return res.status(200).json({ success : true , username : username });
  };
});

// POST REGISTER
app.post("/register", async (req, res) => {
    const { username, loginId, loginPw, createdAt} = req.body;
    if (!username || !loginId || !loginPw) {
      return res.status(404).json({ message: "빈칸입니다" });
    }

    const userExists = await User.exists({ loginId }).exec();
  
    if (userExists)
      return res.status(409).json({ message: "이미 사용중인 아이디 입니다" });
  
    try {

      hashedPassword = await bcrypt.hash(loginPw, 10);
  
      await User.create({ username, loginId, loginPw: hashedPassword, createdAt });
  
      return res.status(201).json({ success: true, message: "회원가입 성공" });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "회원가입에 실패하였습니다" });
    }
  });

// POST WRITE
app.post('/write', async (req, res) => {
    const { title, content, userId ,createdAt } = req.body;

    try {

        const postCount = await Counter.findOneAndUpdate(
          {},
          { $inc: { count: 1 }},
          { new: true }
        );

        const postNumber = postCount.count;

        // console.log(postNumber)

        const findUser = await User.findOne({ _id : userId }).exec();

        if(!findUser) {
            return res.status(404).json({ Message : '유저가 없음' });
        }

        const post = new Post({
            title,
            content,
            writer: findUser._id,
            createdAt,
            postNumber,
        });

        await post.save();

        // console.log(post);

        return res.status(200).json({ success : true, Message : '글 작성 성공' });

    } catch (error) {
      console.error(error);
    }

})

// POST COMMENT
app.post('/writeComment/:id', async (req, res) => {

    try {

      const { comment, commentBy, commentAt } = req.body;
      const { id } = req.params;
  
      const post = await Post.findById(id);
  
      if (!post) {
        return res.status(404).json({ message: "포스트가 없습니다" });
      }
  
      const newComment = {
        comment: comment,
        commentBy: commentBy,
        commentAt: commentAt,
      };
  
      post.comments.push(newComment);
      const updatePost = await post.save();
      res.status(201).json(updatePost);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }

})

// PUT //--------------------

// PUT UPDATE POST
app.put('/write/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { title, content } = req.body;

      if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ Message : '포스트가 없습니다' })
      }

      const updatedPost = { title, content };
      await Post.findByIdAndUpdate(id, updatedPost, { new: true });
      res.status(200).json(updatedPost);
    } catch (error) {
      console.log(error);
    }
});

// DELETE //--------------------

// DELETE POST
app.delete("/board/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findByIdAndRemove(id);
    res.status(200).json({ Message : '포스트가 삭제되었습니다'});
  } catch (error) {
    console.log(error);
  }
});

// DELETE COMMENT
app.delete('/comment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { postId } = req.body;
    
    // console.log(id);
    // console.log( postId );

    const post = await Post.findByIdAndUpdate(
      req.body.postId,
      { $pull: { comments : { _id: id } } },
      { new : true }
    );

    res.status(200).json(post);

  } catch (error) {
    console.log(error);
  }
})