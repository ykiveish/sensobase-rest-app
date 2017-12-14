#define MAX_LENGTH 64
#define OPCODE_GET_CONFIG_REGISTER                    0x1
#define OPCODE_SET_CONFIG_REGISTER                    0x2
#define OPCODE_GET_BASIC_SENSOR_VALUE                 0x3
#define OPCODE_SET_BASIC_SENSOR_VALUE                 0x4

#define OPCODE_GET_DEVICE_TYPE                        0x50
#define OPCODE_GET_DEVICE_UUID                        0x51

#define OPCODE_GET_ARDUINO_NANO_USB_SENSOR_VALUE      0x100
#define OPCODE_SET_ARDUINO_NANO_USB_SENSOR_VALUE      0x101

struct mks_header {
  unsigned char   magic_number[2];
  unsigned short  op_code;
  unsigned char   content_length;
};

