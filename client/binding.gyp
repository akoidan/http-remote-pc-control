{
  "targets": [
    {
      "target_name": "window",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "conditions":[
        ["OS=='win'", {
      	  "sources": [ "src/native/win32/window.cc", "src/native/win32/keypress.c" ]
      	}],
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}
