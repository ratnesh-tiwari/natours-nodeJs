class APIFeaturs {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach(el => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    const sortBy = this.queryString.sort
      ? this.queryString.sort.split(",").join(" ")
      : "-createdAt";

    this.query = this.query.sort(sortBy);

    return this;
  }

  limitFields() {
    const fields = this.queryString.fields
      ? this.queryString.fields.split(",").join(" ")
      : "-__v";

    this.query = this.query.select(fields);
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeaturs;
