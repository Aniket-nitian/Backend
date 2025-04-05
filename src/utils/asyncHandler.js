const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

//! OR (TRY CATCH)

//? const asynchandler = ()=>{}
//function ke andar function
//? const asynchandler = (fn)=>{ (fn)=>{} }

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     req.send(err.coe || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export default asyncHandler;
