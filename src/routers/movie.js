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

    return req.json({
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

router.get("/all", async (req, res) => {
  try {
    const movies = await Movie.find().populate("director");

    if (movies) {
      for (let i = 0; i < movies.length; i++) {
        const categoryDetail = await CategoryDetail.find({
          movie: movies[i]._id,
        }).populate("category");
        const screenDetail = await ScreenDetail.find({
          movie: movies[i]._id,
        }).populate("screen");

        const categories = [];
        for (let item of categoryDetail) {
          categories.push(item.category);
        }

        const screens = [];
        for (let item of screenDetail) {
          screens.push(item.screen);
        }
        movies[i] = { ...movies[i]._doc, categories, screens };
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
        values: { movie },
      });
    }
    return res.json({
      success: false,
      message: "Lấy phim thất bại",
      values: { movie: {} },
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
