#define ASSERT_NUMBER(info, index) \
if (info.Length() <= index || !info[index].IsNumber()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a number"); \
}


#define ASSERT_STRING(info, index) \
if (info.Length() <= index || !info[index].IsString()) { \
throw Napi::TypeError::New(info.Env(), "Argument " #index " must be a string"); \
}


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
