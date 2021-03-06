const Course = require('../models/Course');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Theory = require('../models/Theory');
const Exercise = require('../models/Exercise');
const TheoryDone = require('../models/TheoryDone');
const ExerciseDone = require('../models/ExerciseDone');
const CourseUser = require('../models/CourseUser');
const LastTaskSeen = require('../models/LastTaskSeen');

Course.belongsToMany(User, { through: CourseUser });
User.belongsToMany(Course, { through: CourseUser });

Course.hasMany(Chapter);

Theory.hasMany(TheoryDone);

Exercise.hasMany(ExerciseDone);

Chapter.hasMany(Topic);

Topic.hasOne(Theory);

Topic.hasMany(Exercise);

Exercise.belongsToMany(User, { through: ExerciseDone });
User.belongsToMany(Exercise, { through: ExerciseDone });

Theory.belongsToMany(User, { through: TheoryDone });
User.belongsToMany(Theory, { through: TheoryDone });

User.hasMany(LastTaskSeen);
Course.hasMany(LastTaskSeen);
Chapter.hasMany(LastTaskSeen);
Topic.hasMany(LastTaskSeen);
Theory.hasMany(LastTaskSeen);
Exercise.hasMany(LastTaskSeen);
