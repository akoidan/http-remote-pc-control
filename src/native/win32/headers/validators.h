#define GET_INT_64(info, index, varName, type) \
if (info.Length() <= index || !info[index].IsNumber()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a number"); \
} \
type varName = reinterpret_cast<type>(info[index].As<Napi::Number>().Int64Value())



#define GET_INT_32(info, index, varName, type) \
if (info.Length() <= index || !info[index].IsNumber()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a number"); \
} \
type varName = reinterpret_cast<type>(info[index].As<Napi::Number>().Int32Value())


#define GET_INT_32_NC(info, index, varName, type) \
if (info.Length() <= index || !info[index].IsNumber()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a number"); \
} \
type varName = info[index].As<Napi::Number>().Int32Value();


#define GET_UINT_32(info, index, varName, type) \
if (info.Length() <= index || !info[index].IsNumber()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a number"); \
} \
type varName = info[0].As<Napi::Number>().Uint32Value();

#define GET_STRING(info, index, varName) \
if (info.Length() <= index || !info[index].IsString()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a string"); \
} \
std::string varName = info[index].As<Napi::String>();


#define ASSERT_BOOL(info, index) \
if (info.Length() <= index || !info[index].IsBoolean()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a string"); \
}


#define ASSERT_ARRAY(info, index) \
if (info.Length() <= index || !info[index].IsArray()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be an array"); \
}

#define ASSERT_OBJECT(info, index) \
if (info.Length() <= index || !info[index].IsObject()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be an object"); \
}

#define ASSERT_OBJECT_NUMBER(info, position, attribute) \
do { \
  Napi::Object obj = info[position].As<Napi::Object>(); \
  Napi::Value val = obj.Get(#attribute); \
  if (!val.IsNumber()) { \
    throw Napi::TypeError::New(info.Env(), "Object property '" #attribute "' must be a number"); \
  } \
} while(0)
