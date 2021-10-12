import express from "express";
const router = express.Router();
import request from "supertest";

import Movie from "../models/Movie";
import CategoryDetail from "../models/CategoryDetail";
import ScreenDetail from "../models/ScreenDetail";

import { addCategoryDetail, addSCreenDetail } from "../api/serverAPI";
import { ValidateMovie } from "../utils/validators";

router.post("/add", async (req, res) => {
  const client = request(req.app);
  const {
    name,
    moveDuration,
    image,
    trailer,
    description,
    directorId,
    cast,
    screensId,
    categoryId,
    age,
  } = req.body;

  try {
    const { valid, errors } = ValidateMovie(
      name,
      moveDuration,
      image,
      trailer,
      directorId,
      cast,
      age
    );
    if (valid) {
      const movie = new Movie({
        name,
        moveDuration,
        image,
        trailer,
        description,
        director: directorId,
        cast,
        age,
      });
      await movie.save();
      // thêm xuất chiếu phim
      addSCreenDetail(client, screensId, "/api/screenDetail/add", movie._id);
      // thêm thể loại
      addCategoryDetail(
        client,
        categoryId,
        "/api/categoryDetail/add",
        movie._id
      );

      return res.json({
        success: true,
        message: "Thêm phim thành công",
        values: {
          movie,
        },
      });
    }

    return res.json({
      success: false,
      message: "Tạo phim thất bại",
      errors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi 400!",
      errors: error.message,
    });
  }
});

router.put("/update/:id", async (req, res) => {
  const client = request(req.app);
  const {
    name,
    moveDuration,
    image,
    trailer,
    description,
    directorId,
    cast,
    screensId,
    categoryId,
    age,
  } = req.body;

  try {
    const movie = await Movie.findById(req.params.id);
    const { valid, errors } = ValidateMovie(
      name,
      moveDuration,
      image,
      trailer,
      directorId,
      cast,
      age
    );
    if (valid) {
      movie.name = name;
      movie.moveDuration = moveDuration;
      movie.image = image;
      movie.trailer = trailer;
      movie.description = description;
      movie.directorId = directorId;
      movie.cast = cast;
      movie.age = age;
      await movie.save();

      // delete screen detail
      await ScreenDetail.find({ movie: req.params.id }).deleteMany().exec();
      // delete category detail
      await CategoryDetail.find({ movie: req.params.id }).deleteMany().exec();

      // thêm màng hình
      addSCreenDetail(client, screensId, "/api/screenDetail/add", movie._id);
      // thêm thể loại
      addCategoryDetail(
        client,
        categoryId,
        "/api/categoryDetail/add",
        movie._id
      );

      return res.json({
        success: true,
        message: "Sửa phim thành công",
        values: {
          movie,
        },
      });
    }

    return res.json({
      success: false,
      message: "Sửa phim thất bại",
      errors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi 400!",
      errors: error.message,
    });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).deleteOne().exec();
    if (movie) {
      // delete screen detail
      await ScreenDetail.find({ movie: req.params.id }).deleteMany().exec();
      // delete category detail
      await CategoryDetail.find({ movie: req.params.id }).deleteMany().exec();

      return res.json({
        success: true,
        message: "Xóa phim thành công",
      });
    }
    return req.json({
      success: false,
      message: "xóa phim thất bại",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi 400!",
      errors: error.message,
    });
  }
});

const getMovie = async (movie) => {
  const categoryDetail = await CategoryDetail.find({
    movie: movie.id,
  }).populate("category");
  const screenDetail = await ScreenDetail.find({
    movie: movie.id,
  }).populate("screen");

  const categories = [];
  for (let item of categoryDetail) {
    categories.push(item.category);
  }

  const screens = [];
  for (let item of screenDetail) {
    screens.push(item.screen);
  }
  return { ...movie._doc, categories, screens };
};

router.get("/all", async (req, res) => {
  try {
    const movies = await Movie.find().populate("director");

    if (movies) {
      for (let i = 0; i < movies.length; i++) {
        movies[i] = await await getMovie(movies[i]);
      }
      return res.json({
        success: true,
        message: "Lấy danh sách thể loai phim thành công",
        values: {
          movies,
        },
      });
    }
    return res.json({
      success: false,
      message: "Lấy danh sách phim thất bại",
      values: { movies: [] },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi 400!",
      errors: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (movie) {
      return res.json({
        success: true,
        message: "Lấy phim thành công",
        values: {
          movie: await getMovie(movie),
        },
      });
    }
    return res.json({
      success: false,
      message: "Lấy phim thất bại",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi 400!",
      errors: error.message,
    });
  }
});

module.exports = router;
